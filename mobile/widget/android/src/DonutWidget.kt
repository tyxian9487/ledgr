package com.kachingo.app.widget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.graphics.*
import android.widget.RemoteViews
import com.kachingo.app.R
import kotlin.math.min

class DonutWidget : AppWidgetProvider() {
  override fun onUpdate(ctx: Context, mgr: AppWidgetManager, ids: IntArray) {
    ids.forEach { id ->
      val data = WidgetDataManager.load(ctx)
      val views = RemoteViews(ctx.packageName, R.layout.widget_donut)

      val sym = data?.symbol ?: "$"
      views.setTextViewText(R.id.donut_expenses, WidgetDataManager.fmt(data?.expenses ?: 0.0, sym))
      val rem = data?.remaining ?: 0.0
      views.setTextViewText(R.id.donut_remaining, WidgetDataManager.fmt(rem, sym))
      views.setInt(R.id.donut_remaining, "setTextColor",
        if (rem >= 0) Color.WHITE else Color.parseColor("#FCA5A5"))

      // Draw donut bitmap
      val size = 200
      val bmp = drawDonut(data?.slices ?: emptyList(), size)
      views.setImageViewBitmap(R.id.donut_chart, bmp)

      // Deep link to home
      views.setOnClickPendingIntent(R.id.donut_root,
        pendingIntentForUri(ctx, "kachingo://home"))

      mgr.updateAppWidget(id, views)
    }
  }

  private fun drawDonut(slices: List<SliceInfo>, size: Int): Bitmap {
    val bmp = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bmp)
    val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
      style = Paint.Style.STROKE
      strokeWidth = size * 0.18f
    }
    val r = size * 0.36f
    val rect = RectF(size / 2f - r, size / 2f - r, size / 2f + r, size / 2f + r)

    // Background track
    paint.color = Color.argb(50, 255, 255, 255)
    canvas.drawArc(rect, -90f, 360f, false, paint)

    // Slices
    var sweep = -90f
    slices.forEach { s ->
      paint.color = parseColor(s.color)
      val angle = (s.percent / 100f * 360f).toFloat()
      canvas.drawArc(rect, sweep, angle, false, paint)
      sweep += angle
    }
    return bmp
  }

  private fun parseColor(hex: String): Int = try {
    Color.parseColor(if (hex.startsWith("#")) hex else "#$hex")
  } catch (e: Exception) { Color.GRAY }
}
