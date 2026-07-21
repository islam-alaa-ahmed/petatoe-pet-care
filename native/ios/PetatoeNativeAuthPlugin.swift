import Capacitor
import Foundation
import LocalAuthentication
import Security

@objc(PetatoeNativeAuthPlugin)
public final class PetatoeNativeAuthPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "PetatoeNativeAuthPlugin"
    public let jsName = "PetatoeNativeAuth"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isAvailable", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "hasSession", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "storeSession", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "loadSession", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "clearSession", returnType: CAPPluginReturnPromise)
    ]

    private let service = "com.petatoe.enterprise.native-session"
    private let account = "petatoe-enterprise-session"
    private let enrollmentFlag = "PETATOE_NATIVE_SESSION_ENROLLED"

    @objc public func isAvailable(_ call: CAPPluginCall) {
        let context = LAContext()
        var error: NSError?
        let available = context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error)
        var type = "none"
        if available {
            switch context.biometryType {
            case .faceID: type = "faceID"
            case .touchID: type = "touchID"
            case .opticID: type = "opticID"
            default: type = "unknown"
            }
        }
        call.resolve([
            "available": available,
            "biometryType": type,
            "errorCode": error?.code ?? 0
        ])
    }

    @objc public func hasSession(_ call: CAPPluginCall) {
        call.resolve(["hasSession": UserDefaults.standard.bool(forKey: enrollmentFlag)])
    }

    @objc public func storeSession(_ call: CAPPluginCall) {
        guard let session = call.getString("session"), !session.isEmpty,
              let data = session.data(using: .utf8) else {
            call.reject("SESSION_REQUIRED", "SESSION_REQUIRED")
            return
        }

        var accessError: Unmanaged<CFError>?
        guard let access = SecAccessControlCreateWithFlags(
            nil,
            kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly,
            [.biometryCurrentSet],
            &accessError
        ) else {
            call.reject("ACCESS_CONTROL_FAILED", "ACCESS_CONTROL_FAILED", accessError?.takeRetainedValue())
            return
        }

        SecItemDelete(baseQuery() as CFDictionary)
        var query = baseQuery()
        query[kSecValueData as String] = data
        query[kSecAttrAccessControl as String] = access

        let status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else {
            call.reject("KEYCHAIN_STORE_FAILED_\(status)", "KEYCHAIN_STORE_FAILED")
            return
        }
        UserDefaults.standard.set(true, forKey: enrollmentFlag)
        call.resolve(["stored": true])
    }

    @objc public func loadSession(_ call: CAPPluginCall) {
        let reason = call.getString("reason") ?? "Unlock PETATOE with Face ID"
        let context = LAContext()
        context.localizedCancelTitle = "Cancel"

        var query = baseQuery()
        query[kSecReturnData as String] = true
        query[kSecMatchLimit as String] = kSecMatchLimitOne
        query[kSecUseAuthenticationContext as String] = context
        query[kSecUseOperationPrompt as String] = reason

        DispatchQueue.global(qos: .userInitiated).async {
            var item: CFTypeRef?
            let status = SecItemCopyMatching(query as CFDictionary, &item)
            DispatchQueue.main.async {
                guard status == errSecSuccess, let data = item as? Data,
                      let session = String(data: data, encoding: .utf8) else {
                    if status == errSecItemNotFound {
                        UserDefaults.standard.set(false, forKey: self.enrollmentFlag)
                        call.reject("ITEM_NOT_FOUND", "ITEM_NOT_FOUND")
                    } else if status == errSecAuthFailed {
                        call.reject("AUTHENTICATION_FAILED", "AUTHENTICATION_FAILED")
                    } else if status == errSecUserCanceled {
                        call.reject("USER_CANCELLED", "USER_CANCELLED")
                    } else {
                        call.reject("KEYCHAIN_LOAD_FAILED_\(status)", "KEYCHAIN_LOAD_FAILED")
                    }
                    return
                }
                call.resolve(["session": session])
            }
        }
    }

    @objc public func clearSession(_ call: CAPPluginCall) {
        SecItemDelete(baseQuery() as CFDictionary)
        UserDefaults.standard.set(false, forKey: enrollmentFlag)
        call.resolve(["cleared": true])
    }

    private func baseQuery() -> [String: Any] {
        return [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account
        ]
    }
}
