const { withMainApplication, withDangerousMod, withAndroidManifest } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// ── AsyncFunctionComponent patch ───────────────────────────────────────────────
// expo-modules-core changed AsyncFunctionComponent from a concrete class to an
// abstract class. All prebuilt expo module AARs have bytecode that calls
// `new AsyncFunctionComponent(name, argsTypes, body)` (inlined from the old
// createAsyncFunctionComponent factory), which fails at runtime with
// InstantiationError. Fix: restore it as an open class with the 3-arg
// constructor the prebuilt bytecode expects, keeping the existing subclass
// overrides fully intact.
const ASYNC_FUNCTION_COMPONENT_KT = `package expo.modules.kotlin.functions

import android.view.View
import expo.modules.BuildConfig
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.FunctionCallException
import expo.modules.kotlin.exception.exceptionDecorator
import expo.modules.kotlin.exception.toCodedException
import expo.modules.kotlin.jni.decorators.JSDecoratorsBridgingObject
import expo.modules.kotlin.types.AnyType
import expo.modules.kotlin.types.inheritFrom
import expo.modules.kotlin.weak
import kotlinx.coroutines.launch

/**
 * Base class of async function components that require a promise to be called.
 * The optional legacyBody parameter exists for binary compatibility with prebuilt
 * module AARs that were compiled when this class was concrete and accepted a body
 * lambda directly in its constructor.
 */
open class AsyncFunctionComponent(
  name: String,
  desiredArgsTypes: Array<AnyType>,
  private val legacyBody: ((Array<out Any?>) -> Any?)? = null
) : BaseAsyncFunctionComponent(name, desiredArgsTypes) {
  internal open fun callUserImplementation(args: Array<Any?>, promise: Promise, appContext: AppContext) {
    promise.resolve(legacyBody?.invoke(args))
  }

  override fun attachToJSObject(appContext: AppContext, jsObject: JSDecoratorsBridgingObject, moduleName: String) {
    val appContextHolder = appContext.weak()
    jsObject.registerAsyncFunction(
      name,
      takesOwner,
      isEnumerable,
      desiredArgsTypes.map { it.getCppRequiredTypes() }.toTypedArray()
    ) { args, promiseImpl ->
      if (BuildConfig.DEBUG) {
        promiseImpl.decorateWithDebugInformation(
          appContextHolder,
          moduleName,
          name
        )
      }

      val functionBody = {
        try {
          exceptionDecorator({
            FunctionCallException(name, moduleName, it)
          }) {
            callUserImplementation(args, promiseImpl, appContext)
          }
        } catch (e: Throwable) {
          if (promiseImpl.wasSettled) {
            throw e
          }
          promiseImpl.reject(e.toCodedException())
        }
      }

      dispatchOnQueue(appContext, functionBody)
    }
  }

  private fun dispatchOnQueue(appContext: AppContext, block: () -> Unit) {
    when (val queue = queue) {
      Queues.DEFAULT -> {
        appContext.modulesQueue.launch {
          block()
        }
      }

      Queues.MAIN -> {
        if (!BuildConfig.IS_NEW_ARCHITECTURE_ENABLED && desiredArgsTypes.any { it.inheritFrom<View>() }) {
          appContext.dispatchOnMainUsingUIManager(block)
          return
        }

        appContext.mainQueue.launch {
          block()
        }
      }

      is CustomQueue ->
        queue.scope.launch {
          block()
        }
    }
  }
}`;

// Catches uncaught JVM exceptions, saves them, and launches CrashActivity in a
// separate process so the crash details are shown immediately — no JS needed.
const CRASH_HANDLER_KT = [
  'package com.kachingo.app',
  '',
  'import android.app.Application',
  'import android.content.Context',
  'import android.content.Intent',
  'import java.io.File',
  'import java.io.PrintWriter',
  'import java.io.StringWriter',
  '',
  'object CrashHandler : Thread.UncaughtExceptionHandler {',
  '    private var prev: Thread.UncaughtExceptionHandler? = null',
  '    private var ctx: Context? = null',
  '',
  '    fun install(app: Application) {',
  '        ctx = app.applicationContext',
  '        prev = Thread.getDefaultUncaughtExceptionHandler()',
  '        Thread.setDefaultUncaughtExceptionHandler(this)',
  '    }',
  '',
  '    override fun uncaughtException(t: Thread, e: Throwable) {',
  '        val sw = StringWriter()',
  '        e.printStackTrace(PrintWriter(sw))',
  '        val trace = "Thread: ${t.name}\\n\\n$sw"',
  '        try {',
  '            val c = ctx ?: return',
  '            // Persist for JS to read on later successful launches',
  '            File(c.filesDir, "kachingo_native_crash.txt").writeText(trace)',
  '            // SharedPreferences for CrashActivity (separate process, same package)',
  '            c.getSharedPreferences("kachingo_crash", Context.MODE_PRIVATE)',
  '                .edit().putString("last_crash", trace).commit()',
  '            // Launch crash display in its own process so it survives our process dying',
  '            val intent = Intent(c, CrashActivity::class.java)',
  '            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)',
  '            c.startActivity(intent)',
  '        } catch (_: Throwable) {}',
  '        android.os.Process.killProcess(android.os.Process.myPid())',
  '    }',
  '}',
].join('\n');

// Pure Android Activity — no React Native dependency — shows crash and lets user copy it.
const CRASH_ACTIVITY_KT = [
  'package com.kachingo.app',
  '',
  'import android.app.Activity',
  'import android.content.ClipData',
  'import android.content.ClipboardManager',
  'import android.content.Context',
  'import android.graphics.Color',
  'import android.graphics.Typeface',
  'import android.os.Bundle',
  'import android.widget.*',
  '',
  'class CrashActivity : Activity() {',
  '    override fun onCreate(savedInstanceState: Bundle?) {',
  '        super.onCreate(savedInstanceState)',
  '        val crash = getSharedPreferences("kachingo_crash", Context.MODE_PRIVATE)',
  '            .getString("last_crash", "No crash data found") ?: "No crash data found"',
  '',
  '        val root = LinearLayout(this).apply {',
  '            orientation = LinearLayout.VERTICAL',
  '            setPadding(32, 96, 32, 32)',
  '            setBackgroundColor(Color.parseColor("#7f1d1d"))',
  '        }',
  '',
  '        root.addView(TextView(this).apply {',
  '            text = "\\uD83D\\uDCA5 App Crash"',
  '            textSize = 22f',
  '            setTextColor(Color.parseColor("#fef2f2"))',
  '            setPadding(0, 0, 0, 4)',
  '        })',
  '',
  '        root.addView(TextView(this).apply {',
  '            text = "Copy and send this to the developer"',
  '            textSize = 12f',
  '            setTextColor(Color.parseColor("#fca5a5"))',
  '            setPadding(0, 0, 0, 16)',
  '        })',
  '',
  '        val scroll = ScrollView(this)',
  '        scroll.addView(TextView(this).apply {',
  '            text = crash',
  '            textSize = 10f',
  '            setTextColor(Color.parseColor("#fca5a5"))',
  '            typeface = Typeface.MONOSPACE',
  '            setPadding(0, 0, 0, 16)',
  '        })',
  '        root.addView(scroll, LinearLayout.LayoutParams(',
  '            LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f',
  '        ))',
  '',
  '        root.addView(Button(this).apply {',
  '            text = "Copy to Clipboard"',
  '            setBackgroundColor(Color.parseColor("#dc2626"))',
  '            setTextColor(Color.WHITE)',
  '            setOnClickListener {',
  '                val cm = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager',
  '                cm.setPrimaryClip(ClipData.newPlainText("crash", crash))',
  '                Toast.makeText(this@CrashActivity, "Copied!", Toast.LENGTH_SHORT).show()',
  '            }',
  '        }, LinearLayout.LayoutParams(',
  '            LinearLayout.LayoutParams.MATCH_PARENT,',
  '            LinearLayout.LayoutParams.WRAP_CONTENT',
  '        ).apply { setMargins(0, 16, 0, 0) })',
  '',
  '        setContentView(root)',
  '    }',
  '}',
].join('\n');

module.exports = function withAndroidCrashHandler(config) {
  // 1. Write the Kotlin source files during prebuild
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const root = config.modRequest.platformProjectRoot;

      // Crash handler + activity
      const appDir = path.join(root, 'app/src/main/java/com/kachingo/app');
      fs.mkdirSync(appDir, { recursive: true });
      fs.writeFileSync(path.join(appDir, 'CrashHandler.kt'), CRASH_HANDLER_KT);
      fs.writeFileSync(path.join(appDir, 'CrashActivity.kt'), CRASH_ACTIVITY_KT);

      // Patch AsyncFunctionComponent in expo-modules-core source.
      // expo-modules-core always compiles from source (no prebuilt AAR), so
      // this patch is in effect for every build. Prebuilt AARs from other
      // expo modules (expo-notifications, expo-camera, etc.) have inlined
      // bytecode that calls `new AsyncFunctionComponent(name, argsTypes, body)`.
      // With the class abstract those calls fail at runtime; making it open
      // with the 3-arg constructor restores compatibility.
      const asyncFnDir = path.join(
        config.modRequest.projectRoot,
        'node_modules/expo-modules-core/android/src/main/java/expo/modules/kotlin/functions'
      );
      fs.writeFileSync(path.join(asyncFnDir, 'AsyncFunctionComponent.kt'), ASYNC_FUNCTION_COMPONENT_KT);

      // Stub interfaces for expo-file-system's prebuilt AAR.
      // expo-modules-core removed FilePermissionModuleInterface and
      // AppDirectoriesModuleInterface. Without these stubs, D8 drops
      // FilePermissionModule from the APK DEX and the app crashes on startup.
      const ifaceDir = path.join(
        root,
        'app/src/main/java/expo/modules/interfaces/filesystem'
      );
      fs.mkdirSync(ifaceDir, { recursive: true });
      const FILE_PERMISSION_STUB = [
        'package expo.modules.interfaces.filesystem',
        '',
        'import android.content.Context',
        'import java.util.EnumSet',
        '',
        'interface FilePermissionModuleInterface {',
        '    fun getPathPermissions(context: Context, path: String): EnumSet<Permission>',
        '}',
      ].join('\n');
      const APP_DIRS_STUB = [
        'package expo.modules.interfaces.filesystem',
        '',
        'import java.io.File',
        '',
        'interface AppDirectoriesModuleInterface {',
        '    val cacheDirectory: File',
        '    val persistentFilesDirectory: File',
        '}',
      ].join('\n');
      fs.writeFileSync(path.join(ifaceDir, 'FilePermissionModuleInterface.kt'), FILE_PERMISSION_STUB);
      fs.writeFileSync(path.join(ifaceDir, 'AppDirectoriesModuleInterface.kt'), APP_DIRS_STUB);

      return config;
    },
  ]);

  // 2. Install the handler as the very first line of Application.onCreate()
  config = withMainApplication(config, (config) => {
    const { contents } = config.modResults;
    if (contents.includes('CrashHandler.install(this)')) return config;
    config.modResults.contents = contents.replace(
      'override fun onCreate() {',
      'override fun onCreate() {\n    CrashHandler.install(this)'
    );
    return config;
  });

  // 3. Declare CrashActivity in the manifest with android:process=":crash"
  //    so it runs in a separate process and survives the main process dying
  config = withAndroidManifest(config, (config) => {
    const app = config.modResults.manifest.application[0];
    const activities = app.activity || [];
    if (activities.some((a) => a.$['android:name'] === '.CrashActivity')) return config;
    if (!app.activity) app.activity = [];
    app.activity.push({
      $: {
        'android:name': '.CrashActivity',
        'android:process': ':crash',
        'android:exported': 'false',
      },
    });
    return config;
  });

  return config;
};
