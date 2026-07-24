import Capacitor
import UIKit

final class PetatoeViewController: CAPBridgeViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 248.0/255.0, green: 250.0/255.0, blue: 252.0/255.0, alpha: 1.0)
        webView?.isOpaque = false
        webView?.backgroundColor = .clear
    }

    override open func capacitorDidLoad() {
        super.capacitorDidLoad()
        bridge?.registerPluginInstance(PetatoeNativeAuthPlugin())
    }
}
