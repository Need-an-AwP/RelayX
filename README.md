# RelayX

A decentralized voice chat application based on Tailscale network.

## new network structure

the entire network structure of this app is being rebuilt using pion TURN

## core rtc connections manage structrue:

react ui
↑
rtcStore
↑
rtcConnectionManager
↑
rtcConnection

## MISC

- 窗口移动到非主显示器时，断开该显示器后窗口依然会停留在主显示器外的坐标
- `tailscale-ipnstate.ts`中的一些定义类型被手动修改以通过tsc编译