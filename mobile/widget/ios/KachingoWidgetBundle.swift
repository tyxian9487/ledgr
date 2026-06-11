import WidgetKit
import SwiftUI

@main
struct KachingoWidgetBundle: WidgetBundle {
  var body: some Widget {
    DonutWidget()
    CaptureWidget()
    QuickActionsWidget()
    GoalWidget()
  }
}
