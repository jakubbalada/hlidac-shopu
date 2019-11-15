//
//  ViewController.swift
//  hlidac-shopu
//
//  Created by Daniel Hromada on 09/11/2019.
//  Copyright © 2019 Daniel Hromada. All rights reserved.
//

import Cocoa
import SafariServices.SFSafariApplication
import SwiftUI

class ViewController: NSViewController {

    @IBOutlet var appNameLabel: NSTextField!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        self.appNameLabel.stringValue = "hlidac-shopu";
    }
    
    @IBAction func openSafariExtensionPreferences(_ sender: AnyObject?) {
        SFSafariApplication.showPreferencesForExtension(withIdentifier: "com.topmonks.hlidac-shopu-Extension") { error in
            if let _ = error {
                // Insert code to inform the user that something went wrong.

            }
        }
        
        self.view.window?.close()
    }

}