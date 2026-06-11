import Foundation
import WidgetKit

@objc(KachingoWidgetBridge)
class KachingoWidgetBridge: NSObject {

  @objc
  func updateWidgetData(_ json: String) {
    let defaults = UserDefaults(suiteName: "group.com.kachingo.app")
    defaults?.set(json, forKey: "widgetData")
    defaults?.synchronize()
    WidgetCenter.shared.reloadAllTimelines()
  }

  @objc
  static func requiresMainQueueSetup() -> Bool { false }
}
