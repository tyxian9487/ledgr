const { withMainApplication, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const CRASH_HANDLER_KT = [
  'package com.kachingo.app',
  '',
  'import android.app.Application',
  'import java.io.File',
  'import java.io.PrintWriter',
  'import java.io.StringWriter',
  '',
  'object CrashHandler : Thread.UncaughtExceptionHandler {',
  '    private var prev: Thread.UncaughtExceptionHandler? = null',
  '    private var dir: File? = null',
  '',
  '    fun install(app: Application) {',
  '        dir = app.filesDir',
  '        prev = Thread.getDefaultUncaughtExceptionHandler()',
  '        Thread.setDefaultUncaughtExceptionHandler(this)',
  '    }',
  '',
  '    override fun uncaughtException(t: Thread, e: Throwable) {',
  '        try {',
  '            val sw = StringWriter()',
  '            e.printStackTrace(PrintWriter(sw))',
  '            File(dir!!, "kachingo_native_crash.txt").writeText("Thread: ${t.name}\\n\\n$sw")',
  '        } catch (_: Throwable) {}',
  '        prev?.uncaughtException(t, e)',
  '    }',
  '}',
].join('\n');

module.exports = function withAndroidCrashHandler(config) {
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const dir = path.join(
        config.modRequest.platformProjectRoot,
        'app/src/main/java/com/kachingo/app'
      );
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'CrashHandler.kt'), CRASH_HANDLER_KT);
      return config;
    },
  ]);

  config = withMainApplication(config, (config) => {
    const { contents } = config.modResults;
    if (contents.includes('CrashHandler.install(this)')) return config;
    config.modResults.contents = contents.replace(
      'override fun onCreate() {',
      'override fun onCreate() {\n    CrashHandler.install(this)'
    );
    return config;
  });

  return config;
};
