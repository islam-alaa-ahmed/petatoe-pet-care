import Capacitor
import UIKit

final class PetatoeViewController: CAPBridgeViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        let launchBackground = UIColor(red: 248.0/255.0, green: 250.0/255.0, blue: 252.0/255.0, alpha: 1.0)
        view.backgroundColor = launchBackground
        view.window?.backgroundColor = launchBackground
        webView?.isOpaque = true
        webView?.backgroundColor = launchBackground
        webView?.scrollView.backgroundColor = launchBackground
    }

    override open func capacitorDidLoad() {
        super.capacitorDidLoad()
        bridge?.registerPluginInstance(PetatoeNativeAuthPlugin())
    }
}
