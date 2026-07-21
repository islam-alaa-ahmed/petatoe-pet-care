import Capacitor
import UIKit

final class PetatoeViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        super.capacitorDidLoad()
        bridge?.registerPluginInstance(PetatoeNativeAuthPlugin())
    }
}
