import WidgetKit
import SwiftUI

// ── Shared data model ──────────────────────────────────────────────────────────

private let APP_GROUP = "group.com.kachingo.app"

struct SliceData: Codable {
  let color: String
  let percent: Double
  let label: String
}

struct MonthlySavings: Codable {
  let enabled: Bool
  let target: Double
  let saved: Double
}

struct CustomGoal: Codable {
  let name: String
  let target: Double
  let saved: Double
  let color: String
}

struct WidgetData: Codable {
  let income: Double
  let expenses: Double
  let remaining: Double
  let currencySymbol: String
  let slices: [SliceData]
  let monthlySavings: MonthlySavings?
  let customGoal: CustomGoal?
  let updatedAt: String?
}

func loadWidgetData() -> WidgetData? {
  guard let defaults = UserDefaults(suiteName: APP_GROUP),
        let json = defaults.string(forKey: "widgetData"),
        let data = json.data(using: .utf8) else { return nil }
  return try? JSONDecoder().decode(WidgetData.self, from: data)
}

func colorFromHex(_ hex: String) -> Color {
  var h = hex.trimmingCharacters(in: .alphanumerics.inverted)
  if h.count == 6 { h = "FF" + h }
  guard h.count == 8, let val = UInt64(h, radix: 16) else { return .gray }
  let r = Double((val >> 16) & 0xFF) / 255
  let g = Double((val >> 8) & 0xFF) / 255
  let b = Double(val & 0xFF) / 255
  let a = Double((val >> 24) & 0xFF) / 255
  return Color(red: r, green: g, blue: b, opacity: a)
}

func fmt(_ val: Double, symbol: String) -> String {
  let abs = Swift.abs(val)
  if abs >= 1_000_000 { return "\(symbol)\(String(format: "%.1fM", abs / 1_000_000))" }
  if abs >= 1_000 { return "\(symbol)\(String(format: "%.1fK", abs / 1_000))" }
  return "\(symbol)\(String(format: "%.0f", abs))"
}

// ── Shared provider ────────────────────────────────────────────────────────────

struct KachingoEntry: TimelineEntry {
  let date: Date
  let widgetData: WidgetData?
}

struct KachingoProvider: TimelineProvider {
  func placeholder(in context: Context) -> KachingoEntry {
    KachingoEntry(date: Date(), widgetData: nil)
  }
  func getSnapshot(in context: Context, completion: @escaping (KachingoEntry) -> Void) {
    completion(KachingoEntry(date: Date(), widgetData: loadWidgetData()))
  }
  func getTimeline(in context: Context, completion: @escaping (Timeline<KachingoEntry>) -> Void) {
    let entry = KachingoEntry(date: Date(), widgetData: loadWidgetData())
    let next = Calendar.current.date(byAdding: .minute, value: 30, to: Date())!
    completion(Timeline(entries: [entry], policy: .after(next)))
  }
}

// ── Donut chart view ───────────────────────────────────────────────────────────

struct DonutChart: View {
  let slices: [SliceData]
  let lineWidth: CGFloat

  var body: some View {
    ZStack {
      Circle()
        .stroke(Color.white.opacity(0.2), lineWidth: lineWidth)
      ForEach(Array(slices.enumerated()), id: \.offset) { idx, slice in
        Circle()
          .trim(from: CGFloat(offset(at: idx) / 100), to: CGFloat((offset(at: idx) + slice.percent) / 100))
          .stroke(colorFromHex(slice.color), style: StrokeStyle(lineWidth: lineWidth, lineCap: .butt))
          .rotationEffect(.degrees(-90))
      }
    }
  }

  func offset(at index: Int) -> Double {
    slices.prefix(index).reduce(0) { $0 + $1.percent }
  }
}

// ── Widget 1: 2×2 Donut ───────────────────────────────────────────────────────

struct DonutWidgetView: View {
  let entry: KachingoEntry

  var body: some View {
    let d = entry.widgetData
    let symbol = d?.currencySymbol ?? "$"
    let slices = d?.slices ?? []

    ZStack {
      Color(red: 0.07, green: 0.44, blue: 0.24)
      VStack(spacing: 0) {
        Spacer()
        ZStack {
          DonutChart(slices: slices.isEmpty ? [] : slices, lineWidth: 26)
            .frame(width: 160, height: 160)
          VStack(spacing: 2) {
            Text("Expenses")
              .font(.system(size: 10, weight: .medium))
              .foregroundColor(.white.opacity(0.65))
            Text(fmt(d?.expenses ?? 0, symbol: symbol))
              .font(.system(size: 18, weight: .bold))
              .foregroundColor(.white)
          }
        }
        Spacer()
        Divider().background(Color.white.opacity(0.3))
        HStack {
          VStack(alignment: .leading, spacing: 2) {
            Text("Remaining")
              .font(.system(size: 10))
              .foregroundColor(.white.opacity(0.6))
            let rem = d?.remaining ?? 0
            Text(fmt(rem, symbol: symbol))
              .font(.system(size: 18, weight: .bold))
              .foregroundColor(rem >= 0 ? .white : Color(red: 0.99, green: 0.63, blue: 0.63))
          }
          Spacer()
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
      }
    }
    .cornerRadius(20)
    .widgetURL(URL(string: "kachingo://home"))
  }
}

struct DonutWidget: Widget {
  let kind = "KachingoDonutWidget"
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: KachingoProvider()) { entry in
      DonutWidgetView(entry: entry)
    }
    .configurationDisplayName("Monthly Overview")
    .description("Expense donut chart with remaining balance.")
    .supportedFamilies([.systemLarge])
  }
}

// ── Widget 2: 1×1 Capture ─────────────────────────────────────────────────────

struct CaptureWidgetView: View {
  var body: some View {
    ZStack {
      Color(red: 0.07, green: 0.44, blue: 0.24)
      VStack(spacing: 6) {
        Image(systemName: "camera.fill")
          .font(.system(size: 28, weight: .medium))
          .foregroundColor(.white)
        Text("Scan Receipt")
          .font(.system(size: 11, weight: .semibold))
          .foregroundColor(.white.opacity(0.85))
      }
    }
    .cornerRadius(20)
    .widgetURL(URL(string: "kachingo://capture"))
  }
}

struct CaptureWidget: Widget {
  let kind = "KachingoCaptureWidget"
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: KachingoProvider()) { _ in
      CaptureWidgetView()
    }
    .configurationDisplayName("Scan Receipt")
    .description("Quickly open the receipt scanner.")
    .supportedFamilies([.systemSmall])
  }
}

// ── Widget 3: 2×1 Quick Actions ───────────────────────────────────────────────

struct QuickActionsWidgetView: View {
  var body: some View {
    ZStack {
      Color(red: 0.07, green: 0.44, blue: 0.24)
      HStack(spacing: 0) {
        // Capture button
        Link(destination: URL(string: "kachingo://capture")!) {
          VStack(spacing: 6) {
            ZStack {
              Circle()
                .fill(Color.white.opacity(0.2))
                .frame(width: 44, height: 44)
              Image(systemName: "camera.fill")
                .font(.system(size: 20))
                .foregroundColor(.white)
            }
            Text("Scan")
              .font(.system(size: 11, weight: .semibold))
              .foregroundColor(.white.opacity(0.85))
          }
          .frame(maxWidth: .infinity)
        }

        Divider()
          .frame(height: 60)
          .background(Color.white.opacity(0.3))

        // Add transaction button
        Link(destination: URL(string: "kachingo://add")!) {
          VStack(spacing: 6) {
            ZStack {
              Circle()
                .fill(Color.white.opacity(0.2))
                .frame(width: 44, height: 44)
              Image(systemName: "plus")
                .font(.system(size: 22, weight: .medium))
                .foregroundColor(.white)
            }
            Text("Add")
              .font(.system(size: 11, weight: .semibold))
              .foregroundColor(.white.opacity(0.85))
          }
          .frame(maxWidth: .infinity)
        }
      }
    }
    .cornerRadius(20)
  }
}

struct QuickActionsWidget: Widget {
  let kind = "KachingoQuickActionsWidget"
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: KachingoProvider()) { _ in
      QuickActionsWidgetView()
    }
    .configurationDisplayName("Quick Actions")
    .description("Scan a receipt or add a transaction.")
    .supportedFamilies([.systemMedium])
  }
}

// ── Widget 4: 2×2 Goals ───────────────────────────────────────────────────────

struct GoalRowView: View {
  let title: String
  let saved: Double
  let target: Double
  let symbol: String
  let color: Color

  var progress: Double { target > 0 ? min(1, saved / target) : 0 }

  var body: some View {
    VStack(alignment: .leading, spacing: 4) {
      HStack {
        Text(title)
          .font(.system(size: 11, weight: .semibold))
          .foregroundColor(.white)
          .lineLimit(1)
        Spacer()
        Text("\(Int(progress * 100))%")
          .font(.system(size: 11, weight: .bold))
          .foregroundColor(color)
      }
      GeometryReader { geo in
        ZStack(alignment: .leading) {
          Capsule().fill(Color.white.opacity(0.2))
          Capsule()
            .fill(color)
            .frame(width: geo.size.width * CGFloat(progress))
        }
      }
      .frame(height: 6)
      HStack {
        Text(fmt(saved, symbol: symbol))
          .font(.system(size: 10))
          .foregroundColor(.white.opacity(0.7))
        Spacer()
        Text(fmt(target, symbol: symbol))
          .font(.system(size: 10))
          .foregroundColor(.white.opacity(0.5))
      }
    }
    .padding(10)
    .background(Color.white.opacity(0.12))
    .cornerRadius(12)
  }
}

struct AddGoalRowView: View {
  var body: some View {
    HStack {
      Image(systemName: "plus.circle.fill")
        .foregroundColor(.white.opacity(0.6))
      Text("Add a Goal")
        .font(.system(size: 13, weight: .medium))
        .foregroundColor(.white.opacity(0.6))
    }
    .frame(maxWidth: .infinity)
    .padding(10)
    .background(Color.white.opacity(0.08))
    .overlay(
      RoundedRectangle(cornerRadius: 12)
        .strokeBorder(Color.white.opacity(0.25), style: StrokeStyle(lineWidth: 1, dash: [4]))
    )
    .cornerRadius(12)
  }
}

struct GoalWidgetView: View {
  let entry: KachingoEntry

  var body: some View {
    let d = entry.widgetData
    let symbol = d?.currencySymbol ?? "$"
    let hasMonthlySavings = d?.monthlySavings?.enabled == true
    let hasCustomGoal = d?.customGoal != nil
    let noGoals = !hasMonthlySavings && !hasCustomGoal

    ZStack {
      Color(red: 0.07, green: 0.44, blue: 0.24)
      VStack(alignment: .leading, spacing: 10) {
        Text("Goals")
          .font(.system(size: 13, weight: .bold))
          .foregroundColor(.white)

        if noGoals {
          Spacer()
          AddGoalRowView()
          Spacer()
        } else {
          // Upper 2×1 row: monthly savings goal
          Group {
            if hasMonthlySavings, let ms = d?.monthlySavings {
              GoalRowView(
                title: "Monthly Savings",
                saved: ms.saved,
                target: ms.target,
                symbol: symbol,
                color: Color(red: 0.13, green: 0.76, blue: 0.37)
              )
            } else {
              AddGoalRowView()
            }
          }
          .frame(maxWidth: .infinity, maxHeight: .infinity)

          // Lower 2×1 row: custom savings goal or add button
          Group {
            if hasCustomGoal, let cg = d?.customGoal {
              GoalRowView(
                title: cg.name,
                saved: cg.saved,
                target: cg.target,
                symbol: symbol,
                color: colorFromHex(cg.color)
              )
            } else {
              AddGoalRowView()
            }
          }
          .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
      }
      .padding(14)
    }
    .cornerRadius(20)
    .widgetURL(URL(string: "kachingo://budget"))
  }
}

struct GoalWidget: Widget {
  let kind = "KachingoGoalWidget"
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: KachingoProvider()) { entry in
      GoalWidgetView(entry: entry)
    }
    .configurationDisplayName("Goals")
    .description("Track your monthly savings and custom goals.")
    .supportedFamilies([.systemLarge])
  }
}
