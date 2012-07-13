// Notification service
/*
Components.classes['@paxal.net/html5notifications/notification-service;1']
  .getService().QueryInterface(Components.interfaces.nsIPXLNotificationService);
*/

Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

// Local declaration
var PXLPermissions =
{
  _prefsBranch: Components.classes["@mozilla.org/preferences-service;1"]
      .getService(Components.interfaces.nsIPrefService)
      .getBranch("extensions.html5notifications."),
	
	prefName: 'permissions', // Might change with private browsing

	_privatePermissions: '{}',
	PrivateBrowsingChange: function()
	{
		// Reset database on enter in case of...
		// Reset database on quit to delete data
		PXLPermissions._privatePermissions = '{}';
	},
	getPrivateBrowsingMode: function()
	{
		this.initPBL();
		return this._PBLObject.inPrivateBrowsing;
	},

  /**
   * Return true if we force image hiding (see bug #32)
   */
  Prefs_hideImages: function()
  {
    var bVal = PXLPermissions.Prefs_getBoolean('hideImages');
    //dump(JSON.stringify(bVal)+"\n");
    return bVal !== false; // Cast to boolean
  },
  Prefs_getBoolean: function(aName)
  {
    return PXLPermissions._prefsBranch.getBoolPref(aName);
  },
  Prefs_getInt: function(aName)
  {
    if(PXLPermissions._prefsBranch.prefHasUserValue(aName))
      return PXLPermissions._prefsBranch.getIntPref(aName);

    return null;
  },
  Prefs_getString: function(aName)
  {
		if(this.getPrivateBrowsingMode() && aName == 'permissions')
		{
			return this._privatePermissions;
		}

    if(PXLPermissions._prefsBranch.prefHasUserValue(aName))
      return PXLPermissions._prefsBranch.getCharPref(aName);

    return null;
  },
  Prefs_setString: function(aName, aValue)
  {
		if(this.getPrivateBrowsingMode() && aName == 'permissions')
		{
			return this._privatePermissions = aValue;
		}
    return PXLPermissions._prefsBranch.setCharPref(aName, aValue);
  },
	
  listPermissions: function()
  {
    var permissionsStr = PXLPermissions.Prefs_getString('permissions');
    if(!permissionsStr || permissionsStr.length == 0)
    {
      permissionsStr = '{}';
    }
    var permissions = JSON.parse(permissionsStr);
		if(typeof(permissions) != 'object') permissions = {};
		return permissions;
  },

  setPermission: function(aHost, aPermission)
	{
		var permissionsStr = PXLPermissions.Prefs_getString('permissions');
		if(!permissionsStr || permissionsStr.length == 0)
		{
			permissionsStr = '{}';
		}
		var permissions = JSON.parse(permissionsStr);
		permissions[aHost] = aPermission;

		permissionsStr = JSON.stringify(permissions);
		PXLPermissions.Prefs_setString('permissions', permissionsStr);
	},

  unsetPermission: function(aHost)
  {
    var permissionsStr = PXLPermissions.Prefs_getString('permissions');
    if(!permissionsStr || permissionsStr.length == 0)
    {
      permissionsStr = '{}';
    }
    var permissions = JSON.parse(permissionsStr);
    if(aHost in permissions)
		{
			delete permissions[aHost];
		}

    permissionsStr = JSON.stringify(permissions);
    PXLPermissions.Prefs_setString('permissions', permissionsStr);
  },

  getPermission: function(aHost)
  {
    var permissionsStr = PXLPermissions.Prefs_getString('permissions');
    if(!permissionsStr || permissionsStr.length == 0)
    {
      permissionsStr = '{}';
    }
    var permissions = JSON.parse(permissionsStr);
    if(!(aHost in permissions))
    {
      // Undefined permission
			//dump("nsIPXLNotificationService.getPermission : " + aHost + " => " + Components.interfaces.nsIPXLNotificationCenter.PERMISSION_NOT_ALLOWED + "\n");
      return Components.interfaces.nsIPXLNotificationCenter.PERMISSION_NOT_ALLOWED;
    }
    else
    {
			//dump("nsIPXLNotificationService.getPermission : " + aHost + " => " + permissions[aHost] + "\n");
      return permissions[aHost];
    }
  },

	_PBLObject: null,
	initPBL: function()
	{
		if(!this._PBLObject)
		{
			this._PBLObject = new PrivateBrowsingListener();
		}
	}
}


function NotificationService() {
}

NotificationService.prototype = {
  contractID: "@paxal.net/html5notifications/notification-service;1",
  classID: Components.ID("{727c4b2c-fb16-4c51-bc9e-7d8499298837}"),
  className: "PXL HTML5 Notifications services",
    
  QueryInterface: XPCOMUtils.generateQI([Components.interfaces.nsIPXLNotificationService]),
	getXULWindowFromDOMWindow: function(aDOMWindow)
	{
		// Find xul:window and xul:browser
		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
			.getService(Components.interfaces.nsIWindowMediator);
		var xulwins = wm.getEnumerator("navigator:browser");
		while(xulwins.hasMoreElements())
		{
			var xulwin = xulwins.getNext();
			if(this.browser = xulwin.gBrowser.getBrowserForDocument(aDOMWindow.top.document))
			{
				return xulwin;
			}
		}
		return null;
	},

  getNotificationWindowFromUID: function(aUid)
  {
    // Iterate over chrome windows and find window with attribute uid
    var windowManager = Components.classes['@mozilla.org/appshell/window-mediator;1']
                            .getService(Components.interfaces.nsIWindowMediator);
    var windows = windowManager.getXULWindowEnumerator('alert:alert');
    while(windows.hasMoreElements())
    {
      var alertWindow = windows.getNext().QueryInterface(Components.interfaces.nsIXULWindow);
      // Get DOMWindow from XULWindow
      var win = alertWindow.docShell.contentViewer.DOMDocument.defaultView;
      // Decode cookieData
			try {
        if('gAlertCookie' in win)
        {
          var cookieData = JSON.parse(win.gAlertCookie);
          if(cookieData && ('uid' in cookieData) && cookieData.uid == aUid)
          {
            return win;
          }
        }
			} catch(e) { dump('PXLH5N Caught error : '+e+"\n"); }
		}

    return null;
  },

  getNotificationWindowFromReplaceUID: function(aReplaceUid)
  {
    // Iterate over chrome windows and find window with attribute uid
    var windowManager = Components.classes['@mozilla.org/appshell/window-mediator;1']
                            .getService(Components.interfaces.nsIWindowMediator);
    var windows = windowManager.getXULWindowEnumerator('alert:alert');
    while(windows.hasMoreElements())
    {
      var alertWindow = windows.getNext().QueryInterface(Components.interfaces.nsIXULWindow);
      // Get DOMWindow from XULWindow
      var win = alertWindow.docShell.contentViewer.DOMDocument.defaultView;
      // Decode cookieData
			try {
        if('gAlertCookie' in win)
        {
          var cookieData = JSON.parse(win.gAlertCookie);
          if(cookieData && ('replaceUid' in cookieData) && cookieData.replaceUid == aReplaceUid)
          {
            return win;
          }
        }
			} catch(e) { }
		}

    return null;
  },

	getPermission: PXLPermissions.getPermission,
	setPermission: PXLPermissions.setPermission,
	listPermissions: PXLPermissions.listPermissions,
	unsetPermission: PXLPermissions.unsetPermission,
	Prefs_getInt: PXLPermissions.Prefs_getInt,
  Prefs_hideImages: PXLPermissions.Prefs_hideImages,
	getPrivateBrowsingMode: function() { return PXLPermissions.getPrivateBrowsingMode(); }
};


/** PrivateBrowsingListener Start **/
/** Code got on MDC : https://developer.mozilla.org/En/Supporting_private_browsing_mode **/
function PrivateBrowsingListener()
{
	this.init();
}
PrivateBrowsingListener.prototype =
{
	_os: null,
	_inPrivateBrowsing: false, // whether we are in private browsing mode
	_watcher:
	{
		onEnterPrivateBrowsing: function() { PXLPermissions.PrivateBrowsingChange(); },
		onExitPrivateBrowsing:  function() { PXLPermissions.PrivateBrowsingChange(); }
	},

	init : function ()
	{
		this._inited = true;
		this._os = Components.classes["@mozilla.org/observer-service;1"]
			.getService(Components.interfaces.nsIObserverService);
		this._os.addObserver(this, "private-browsing", false);
		this._os.addObserver(this, "quit-application", false);
		try {
			var pbs = Components.classes["@mozilla.org/privatebrowsing;1"]
				.getService(Components.interfaces.nsIPrivateBrowsingService);
			this._inPrivateBrowsing = pbs.privateBrowsingEnabled;
		} catch(ex) {
			// ignore exceptions in older versions of Firefox
		}
	},

	observe : function (aSubject, aTopic, aData)
	{
		if (aTopic == "private-browsing") {
			if (aData == "enter") {
				this._inPrivateBrowsing = true;
				if (this.watcher &&
						"onEnterPrivateBrowsing" in this._watcher) {
					this.watcher.onEnterPrivateBrowsing();
				}
			} else if (aData == "exit") {
				this._inPrivateBrowsing = false;
				if (this.watcher &&
						"onExitPrivateBrowsing" in this._watcher) {
					this.watcher.onExitPrivateBrowsing();
				}
			}
		} else if (aTopic == "quit-application") {
			this._os.removeObserver(this, "quit-application");
			this._os.removeObserver(this, "private-browsing");
		}
	},

	get inPrivateBrowsing() {
		return this._inPrivateBrowsing;
	},

	get watcher() {
		return this._watcher;
	},

	set watcher(val) {
		this._watcher = val;
	}
};
/** PrivateBrowsingListener End **/

var components = [NotificationService];

if (XPCOMUtils.generateNSGetFactory)
	var NSGetFactory = XPCOMUtils.generateNSGetFactory(components);
else
	var NSGetModule = XPCOMUtils.generateNSGetModule(components);

