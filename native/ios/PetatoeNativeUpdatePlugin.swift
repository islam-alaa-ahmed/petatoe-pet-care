import Capacitor
import Foundation
import UIKit

@objc(PetatoeNativeUpdatePlugin)
public final class PetatoeNativeUpdatePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "PetatoeNativeUpdatePlugin"
    public let jsName = "PetatoeNativeUpdate"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getAppInfo", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "openUpdateURL", returnType: CAPPluginReturnPromise)
    ]

    @objc public func getAppInfo(_ call: CAPPluginCall) {
        let dictionary = Bundle.main.infoDictionary ?? [:]
        let version = dictionary["CFBundleShortVersionString"] as? String ?? "0.0.0"
        let build = dictionary["CFBundleVersion"] as? String ?? "0"
        call.resolve([
            "version": version,
            "build": build,
            "bundleId": Bundle.main.bundleIdentifier ?? ""
        ])
    }

    @objc public func openUpdateURL(_ call: CAPPluginCall) {
        guard let raw = call.getString("url"), let url = URL(string: raw), url.scheme == "https" else {
            call.reject("INVALID_UPDATE_URL", "INVALID_UPDATE_URL")
            return
        }
        let allowedHosts = Set(["apps.apple.com", "testflight.apple.com", "github.com"])
        guard let host = url.host?.lowercased(), allowedHosts.contains(host) else {
            call.reject("UPDATE_URL_HOST_NOT_ALLOWED", "UPDATE_URL_HOST_NOT_ALLOWED")
            return
        }
        DispatchQueue.main.async {
            UIApplication.shared.open(url, options: [:]) { opened in
                opened ? call.resolve(["opened": true]) : call.reject("UPDATE_URL_OPEN_FAILED", "UPDATE_URL_OPEN_FAILED")
            }
        }
    }
}
