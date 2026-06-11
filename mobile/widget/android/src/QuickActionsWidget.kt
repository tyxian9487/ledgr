package com.kachingo.app.widget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.widget.RemoteViews
import com.kachingo.app.R

class QuickActionsWidget : AppWidgetProvider() {
  override fun onUpdate(ctx: Context, mgr: AppWidgetManager, ids: IntArray) {
    ids.forEach { id ->
      val views = RemoteViews(ctx.packageName, R.layout.widget_quick_actions)
      views.setOnClickPendingIntent(R.id.qa_capture_btn, pendingIntentForUri(ctx, "kachingo://capture"))
      views.setOnClickPendingIntent(R.id.qa_add_btn, pendingIntentForUri(ctx, "kachingo://add"))
      mgr.updateAppWidget(id, views)
    }
  }
}
