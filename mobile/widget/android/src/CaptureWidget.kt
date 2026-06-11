package com.kachingo.app.widget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.widget.RemoteViews
import com.kachingo.app.R

class CaptureWidget : AppWidgetProvider() {
  override fun onUpdate(ctx: Context, mgr: AppWidgetManager, ids: IntArray) {
    ids.forEach { id ->
      val views = RemoteViews(ctx.packageName, R.layout.widget_capture)
      views.setOnClickPendingIntent(R.id.capture_root, pendingIntentForUri(ctx, "kachingo://capture"))
      mgr.updateAppWidget(id, views)
    }
  }
}
