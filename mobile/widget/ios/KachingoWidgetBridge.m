#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(KachingoWidgetBridge, NSObject)
RCT_EXTERN_METHOD(updateWidgetData:(NSString *)json)
@end
