Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

const Ci = Components.interfaces;
const Cr = Components.results;

	/* nsIPXLNotificationService */
var nsIPXLNS = null;


function NotificationCenter() {
	this.wrappedJSObject = this;
}

NotificationCenter.prototype = {
	classDescription: "PXL Notification Center",
	classID:          Components.ID("{d931339b-60b1-4559-9459-a69ed1396561}"),
	contractID:       "@paxal.net/html5notifications/notification-center;1",
	flags: Components.interfaces.nsIClassInfo.DOM_OBJECT,
	implementationLanguage: Components.interfaces.nsIProgrammingLanguage.JAVASCRIPT,
	getInterfaces: function(count) {
		var ifaces = new Array();
		ifaces.push(Components.interfaces.nsIPXLNotificationCenter);
		ifaces.push(Components.interfaces.nsIClassInfo);
		('nsIDOMGlobalPropertyInitializer' in Ci) && ifaces.push(Components.interfaces.nsIDOMGlobalPropertyInitializer);
		ifaces.push(Components.interfaces.nsISupports);
		count.value = ifaces.length;
		return ifaces;
	},
	getHelperForLanguage: function(language) {
		return null;
	},
	_xpcom_categories: [     
		/* AMO notification center object has to be registered into window object */
		/* AMO @see http://www.chromium.org/developers/design-documents/desktop-notifications/api-specification */
		/* AMO @abstract The NotificationCenter interface is available via the Window interface through the webkitNotifications property */
		{category: "JavaScript global property", entry: "webkitNotifications"}
	],
	QueryInterface: function(iid)
  {
    if (
        iid.equals(Ci.nsISupports)
        ||
        iid.equals(Ci.nsIPXLNotificationCenter)
        ||
        iid.equals(Ci.nsIClassInfo)
        ||
        ('nsIDOMGlobalPropertyInitializer' in Ci && iid.equals(Ci.nsIDOMGlobalPropertyInitializer))
    )
      return this;

    throw Cr.NS_ERROR_NO_INTERFACE;
  },
	win: null,
	xulwin: null,
	browser: null,
        uninit: function()
        {
          this.win = null;
          this.xulwin = null;
          this.browser = null;
        },
	init: function(aWindow)
	{
    if (!nsIPXLNS)
      nsIPXLNS = Components.classes['@paxal.net/html5notifications/notification-service;1']
          .getService().QueryInterface(Components.interfaces.nsIPXLNotificationService);
		// Initialize target document window
		this.win = aWindow;

		// Find xul:window and xul:browser
		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
			.getService(Components.interfaces.nsIWindowMediator);
		var xulwins = wm.getEnumerator("navigator:browser");
		while(xulwins.hasMoreElements())
		{
			var xulwin = xulwins.getNext();
			if(this.browser = xulwin.gBrowser.getBrowserForDocument(aWindow.top.document))
			{
				this.xulwin = xulwin;
				break;
			}
		}

    // Unload me
    this.win.addEventListener('unload', (function() { this.uninit(); }).bind(this), true);
	},

	checkPermission: function()
	{
    var loc = this.win.location;
    switch(loc.protocol)
    {
      case 'chrome:':
        return Components.interfaces.nsIPXLNotificationCenter.PERMISSION_ALLOWED;

      case 'http:':
      case 'https:':
        // Check here
        var host = loc.host;
        // Search host in db
				var permission = nsIPXLNS.getPermission(host)
        return permission;

      default:
        // Other protocols not allowed
        return Components.interfaces.nsIPXLNotificationCenter.PERMISSION_DENIED;
    }
	},


  requestPermission: function(aCallback)
  {
		try{

    var callback = function()
    {
			try{
      aCallback.callback();
			}catch(e){}
    }

    // Bug #29 : do not request for permission has already been set
    var currentPermission = this.checkPermission();
    if(currentPermission != Components.interfaces.nsIPXLNotificationCenter.PERMISSION_NOT_ALLOWED)
    {
      // Delay callback
      this.win.setTimeout(callback, 0);
      // And return
      return;
    }

		//this.win.setTimeout(function() { aCallback.callback(1); }, 0);
    // Request permission for host
    var host = this.win.location.host;
		var gBrowser = this.xulwin.gBrowser;

    this._requestPermissionDoorHanger(gBrowser, host, callback) || this._requestPermissionToolbar(gBrowser, host, callback);

		}catch(e){dump('PXLH5N Caught error : '+e);}
  },

  _requestPermissionDoorHanger: function(gBrowser, host, callback)
  {
    try
    {
      // Ask for permission
      var message = this.getLocalizedString('onrequest.message', [host]);

      var defaultButton = 
      {
        label: this.getLocalizedString('onrequest.allow'),
        accessKey: this.getLocalizedString('onrequest.allow.accel'),
        callback: function() { nsIPXLNS.setPermission(host, Components.interfaces.nsIPXLNotificationCenter.PERMISSION_ALLOWED); callback(); }
      };
      var extraButtons =
      [
        {
          label: this.getLocalizedString('onrequest.deny'),
          accessKey: this.getLocalizedString('onrequest.deny.accel'),
          callback: function() { nsIPXLNS.setPermission(host, Components.interfaces.nsIPXLNotificationCenter.PERMISSION_DENIED); callback(); }
        }
      ];
      var options = { 'popupIconURL': 'chrome://html5notifications/content/icons/logo-128.png' };

      ((typeof PopupNotifications) == 'undefined') && Components.utils.import('resource://app/modules/PopupNotifications.jsm');
      var notify =
          new PopupNotifications(
              gBrowser,
              gBrowser.ownerDocument.getElementById("notification-popup"),
              gBrowser.ownerDocument.getElementById("notification-popup-box"));

      notify.show(
          gBrowser.selectedBrowser,
          'pxl-notification',
          message,
          null,
          defaultButton,
          extraButtons,
          options
      );

      return true;
    }
    catch(e) { dump(e+"\n"); }
    return false;
  },

  _requestPermissionToolbar: function(gBrowser, host, callback)
  {
    // Ask for permission
    var message = this.getLocalizedString('onrequest.message', [host]);

    var nb = gBrowser.getNotificationBox(this.browser);
    var n = nb.getNotificationWithValue('pxl-notification');
    if(n) nb.removeNotification(n);
    var buttons = [
      {
        label: this.getLocalizedString('onrequest.deny'),
        accessKey: this.getLocalizedString('onrequest.deny.accel'),
        callback: function() { nsIPXLNS.setPermission(host, Components.interfaces.nsIPXLNotificationCenter.PERMISSION_DENIED); callback(); }
      },
      {
        label: this.getLocalizedString('onrequest.allow'),
        accessKey: this.getLocalizedString('onrequest.allow.accel'),
        callback: function() { nsIPXLNS.setPermission(host, Components.interfaces.nsIPXLNotificationCenter.PERMISSION_ALLOWED); callback(); }
      }
    ];
    n = nb.appendNotification(message, 'pxl-notification',
                         'chrome://browser/skin/Info.png',
                          nb.PRIORITY_WARNING_HIGH, buttons);

    return n;
  },

	getLocalizedString: function(key, strArray)
	{
		var stringBundle = this.xulwin.document.getElementById('pxl-notifications-bundle');
		if(strArray)
		{
			return stringBundle.getFormattedString(key, strArray);
		}
		else
		{
			return stringBundle.getString(key);
		}
	},

	createNotification: function(aIconUrl, aTitle, aBody)
	{
		// Check permission
		var host = this.win.document.location.host;
		if(this.win.webkitNotifications.checkPermission() != this.win.webkitNotifications.PERMISSION_ALLOWED) throw 18;

		try {
		var n = Components.classes['@paxal.net/html5notifications/notification;1']
			.createInstance(Components.interfaces.nsIPXLNotification);

    var resolvedIconUrl = '';
		// Get and resolve aIconUrl
    if(!nsIPXLNS.Prefs_hideImages())
    {
      try
      {
        if(aIconUrl == null || aIconUrl == undefined || ((typeof aIconUrl) == 'string') && aIconUrl.length == 0)
          aIconUrl = this.getDocumentIcon();
      } catch(e) { }
      var ioService = Components.classes["@mozilla.org/network/io-service;1"]
        .getService(Components.interfaces.nsIIOService);
      var iconURI = ioService.newURI(this.win.document.location.toString(), null, null);
      var resolvedIconUrl;
      
      try
      {
        resolvedIconUrl = iconURI.resolve(aIconUrl);
      }
      catch(e)
      {
        // Did not succeed in resolving icon ?
        resolvedIconUrl = ''
      }
    }
    else
    {
      resolvedIconUrl = '';
    }

    // Bug #32 : some problems with icons ?
		n.init(this.win, resolvedIconUrl, aTitle, aBody);
		return n.wrappedJSObject;
		}catch(e) {dump('PXLH5N Caught error : '+e);}return null;
	},

	createHTMLNotification: function(aUrl)
	{
		// Check permission
		var host = this.win.document.location.host;
		if(this.win.webkitNotifications.checkPermission() != this.win.webkitNotifications.PERMISSION_ALLOWED) throw 18;

    if(aUrl.match(/^[a-z]+:/))
    {
      if(!aUrl.match(/(https?|data):/)) throw 18;
    }
		try {
		var n = Components.classes['@paxal.net/html5notifications/notification;1']
			.createInstance(Components.interfaces.nsIPXLNotification);

		n.init(this.win, '', 'html:'+aUrl, '');
		return n.wrappedJSObject;
		}catch(e) {dump('PXLH5N Caught error : '+e);}return null;
	},

	getDocumentIcon: function()
	{
		var doc = this.win.document;

		// Get link rel="icon"
		var links = doc.evaluate('//head/link[@rel="icon"]', doc, null, 4 /* UNORDERED_NODE_ITERATOR_TYPE */, null);
		var link = null;
		var size = 0;
		var href = '';
		while(link = links.iterateNext())
		{
			try // Parsint might fail or attribute might not exist...
			{
				var l_sizes = link.getAttribute('sizes');
				var l_size = 0;
				if(l_sizes && (l_size = l_sizes.match(/^(\d+)x\d+/)))
				{
					l_size = parseInt(l_size[1]);
					if(l_size > size)
					{
						size = l_size;
						href = link.getAttribute('href');
					}
				}
			} catch(e) { }
		}

		if(size == 0)
		{
			// Try to find shortcut icon
			var links = doc.evaluate('//head/link[translate(@rel,"shortcuin","SHORTCUIN")="SHORTCUT ICON"]', doc, null, 4 /* UNORDERED_NODE_ITERATOR_TYPE */, null);
			var link = links.iterateNext();
			if(link)
			{
				href = link.getAttribute('href');
				size = 16; // Maybe... ;)
			}
		}

		if(href && ((typeof href) == 'string') && href.length && size >= 16)
		{
			return href;
		}

		return '';
	}

};


var components = [NotificationCenter];

var NSGetFactory = null;
var NSGetModule  = null;

if (XPCOMUtils.generateNSGetFactory)
	NSGetFactory = XPCOMUtils.generateNSGetFactory(components);
else
	NSGetModule = XPCOMUtils.generateNSGetModule(components);

