try {

const Ci = Components.interfaces;
const Cc = Components.classes;

const CLASS_ID = Components.ID("32f740e1-5355-4955-b51c-0f0604895a20");
const CLASS_NAME = "webkitNotifications class";
const CONTRACT_ID = "@paxal.net/html5notifications/notification;1";

var nsIPXLNS = null;

function PXLNotification() {
  if (!nsIPXLNS)
    nsIPXLNS = Components.classes['@paxal.net/html5notifications/notification-service;1']
        .getService().QueryInterface(Components.interfaces.nsIPXLNotificationService);

	this.wrappedJSObject = this;
}

PXLNotification.prototype = {
  contractID: CONTRACT_ID,
  classID: CLASS_ID,
  className: CLASS_NAME,
	flags: Components.interfaces.nsIClassInfo.DOM_OBJECT,
	implementationLanguage: Components.interfaces.nsIProgrammingLanguage.JAVASCRIPT,
	getInterfaces: function(count) {
		var ifaces = new Array();
		ifaces.push(Components.interfaces.nsIPXLNotification);
		ifaces.push(Components.interfaces.nsIClassInfo);
		ifaces.push(Components.interfaces.nsIDOMEventTarget);
		count.value = ifaces.length;
		return ifaces;
	},
	getHelperForLanguage: function(language) {
		return null;
	},
    
  QueryInterface: function(aIID) {
    if (!aIID.equals(Ci.nsIPXLNotification) && !aIID.equals(Ci.nsISupports) && !aIID.equals(Ci.nsIClassInfo) && !aIID.equals(Ci.nsIDOMEventTarget))
        throw Components.results.NS_ERROR_NO_INTERFACE;
    return this;
  },

  __exposedProps__: {
    'ondisplay': 'rw',
    'onclose': 'rw',
    'onerror': 'rw',
    'onclick': 'rw',

    'replaceId': 'rw',
    'dir': 'rw',

    'show': 'r',
    'close': 'r',
    'cancel': 'r',
  },

  _ondisplay: null,
	get ondisplay() { return this._ondisplay; },
	set ondisplay(aOndisplay) { return this._ondisplay = aOndisplay; },
	get onshow() { return this._ondisplay; },
	set onshow(aOndisplay) { return this._ondisplay = aOndisplay; },
  _onclose: null,
	get onclose() { return this._onclose; },
	set onclose(aOnclose) { return this._onclose = aOnclose; },
  _onerror: null,
	get onerror() { return this._onerror; },
	set onerror(aOnerror) { return this._onerror = aOnerror; },
  _onclick: null,
	get onclick() { return this._onclick; },
	set onclick(aOnclick) { return this._onclick = aOnclick; },

	_replaceId: '',
	get replaceId() { return this._replaceId; },
	set replaceId(aReplaceId) { return this._replaceId = aReplaceId; },

	_dir: '',
	get dir() { return this._dir; },
	set dir(aDir) { return this._dir = aDir; },

  iconUrl: '',
	title: '',
	body: '',
	_uid: '',
	_div: null,
	_tmp: null,
  init: function(aWindow, aIconUrl, aTitle, aBody)
	{
		this.win     = aWindow;
		this.iconUrl = aIconUrl;
		this.title   = aTitle;
		this.body    = aBody;

		// Generate uid
		var r = '' + Math.random();
		this._uid = r.replace(new RegExp('^0\\.'), '');

		// Create div element for events reflection
		this._div = this.win.document.createElement('div');
		var me = this;
		this.addEventListener    = function(a,b,c) { me._div.addEventListener(a,b,c);    };
		this.removeEventListener = function(a,b,c) { me._div.removeEventListener(a,b,c); };
		this.dispatchEvent       = function(e)     { me._div.dispatchEvent(e); };
	},

	addEventListener: function() {},
	removeEventListener: function() {},
	dispatchEvent: function() {},

	getReplaceUid: function()
	{
		try
		{
			return this.win.location.protocol + '//' + this.win.document.domain + ':' + this.win.location.port + '/' + this._replaceId;
		}
		catch(e) { return ''; }
	},

	show: function()
	{
		// Check permission
		var host = this.win.document.location.host;
		if(this.win.webkitNotifications.checkPermission() != this.win.webkitNotifications.PERMISSION_ALLOWED)
		{
			// Error
			this._sendEvent('error');
			return;
		}

		// Deal with already opened notifications with same uid
		if(this._replaceId.length)
		{
			// Try to find the opened notification
			var replaceUid = this.getReplaceUid();
			if(replaceUid.length)
			{
				var xulwin = nsIPXLNS.getNotificationWindowFromReplaceUID(replaceUid);
				if(xulwin && ('PXLH5NAlertWindow' in xulwin))
				{
					try
					{
						// Call our close
						xulwin.PXLH5NAlertWindow.close();
					}
					catch(e) { }
				}
			}
		}

		try{
		var me = this;
		var observer = 
		{
			'notification': me,
			'observe': function(aSubject, aTopic, aData)
			{
				if(aTopic == 'alertclickcallback')
				{
					// We want to focus on the chrome window, and the tab containing aWindow
					this.notification.focusWindow();

					// And call onclick handler
					this.notification._sendEvent('click');
				}

				if(aTopic == 'alertfinished')
				{
					// Call onclose()
					this.notification._sendEvent('close');
				}

				if(aTopic == 'alert-focus')
				{
					// We want to focus on the chrome window, and the tab containing aWindow
					this.notification.focusWindow();
				}

				if(aTopic == 'pxl-disable')
				{
					oCookieData = JSON.parse(aData);
					if((typeof oCookieData) == 'object' && 'host' in oCookieData)
					{
						nsIPXLNS.setPermission(oCookieData.host, 2 /* DENIED */);
					}
				}
			}
		}
		var oCookieData = {'pxl':true,'uid':this._uid,'host':host,'replaceUid':this.getReplaceUid()};
		if(this.title.match(/^html:/))
		{
			if(!this.title.match(/^html:(https?|data):/))
			{
				try {
				var url = this.title.replace(/^html:/, '');
				var referer = '' + this.win.document.location;
				var ioService = Components.classes["@mozilla.org/network/io-service;1"]  
												.getService(Components.interfaces.nsIIOService);  
				var uri = ioService.newURI(referer, this.win.document.characterSet, null);
				url = uri.resolve(url);
				this.title = 'html:' + url;
				} catch(e) { alert(e); }
			}
			oCookieData['pxl'] = 'html';
			oCookieData['html'] = this.title.replace(/^html:/, '');
		}
		var cookieData = JSON.stringify(oCookieData);

		Components.classes['@mozilla.org/alerts-service;1']
			.getService(Components.interfaces.nsIAlertsService)
			.showAlertNotification(this.iconUrl, this.title, this.body, false, cookieData, observer);

		// Send event
		this._sendEvent('display');
		}catch(e){dump('PXLH5N Caught error : '+e);this._sendEvent('error');}
	},

	focusWindow: function()
	{
		// Find xul:window and xul:browser
		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
			.getService(Components.interfaces.nsIWindowMediator);
		var xulwins = wm.getEnumerator("navigator:browser");
		while(xulwins.hasMoreElements())
		{
			var xulwin = xulwins.getNext();
			if(this.browser = xulwin.gBrowser.getBrowserForDocument(this.win.top.document))
			{
				var tabIndex = xulwin.gBrowser.getBrowserIndexForDocument(this.win.top.document);
				// Focus tab
				xulwin.gBrowser.selectTabAtIndex(tabIndex);
				// Focus window
				xulwin.focus();
				break;
			}
		}
	},

	close: function() { this.cancel(); },
	cancel: function()
	{
		try {
    var alertWindow = nsIPXLNS.getNotificationWindowFromUID(this._uid);
    if(alertWindow)
    {
      alertWindow.PXLH5NAlertWindow.close();
			this._sendEvent('close');
    }
		} catch(e) { dump('PXLH5N Caught error : '+e); }
	},

	_sendEvent: function(aEventName)
	{
		try {
		var onEventName = this['_on'+aEventName];
		if(onEventName && (typeof onEventName) == 'function') this.win.setTimeout(onEventName, 0);

    var ev = this.win.document.createEvent('Events');
    ev.initEvent(aEventName, true, false);
    this.dispatchEvent(ev);
		} catch(e) { dump('PXLH5N Caught error : '+e); }
	}
};

// Factory
var PXLNotificationFactory = {
  createInstance: function (aOuter, aIID) {
    if (aOuter != null)
      throw Components.results.NS_ERROR_NO_AGGREGATION;
    return t(new PXLNotification()).QueryInterface(aIID);
  }
};

// Module
var PXLNotificationModule = {
  registerSelf: function(aCompMgr, aFileSpec, aLocation, aType) {
    aCompMgr = aCompMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
    aCompMgr.registerFactoryLocation(CLASS_ID, CLASS_NAME, CONTRACT_ID, aFileSpec, aLocation, aType);
  },

  unregisterSelf: function(aCompMgr, aLocation, aType) {
    aCompMgr = aCompMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
    aCompMgr.unregisterFactoryLocation(CLASS_ID, aLocation);        
  },
  
  getClassObject: function(aCompMgr, aCID, aIID) {
    if (!aIID.equals(Components.interfaces.nsIFactory))
      throw Components.results.NS_ERROR_NOT_IMPLEMENTED;

    if (aCID.equals(CLASS_ID))
      return PXLNotificationFactory;

    throw Components.results.NS_ERROR_NO_INTERFACE;
  },

  canUnload: function(aCompMgr) { return true; }
};

// Module initialization
function NSGetModule(aCompMgr, aFileSpec) { return PXLNotificationModule; }

var NSGetFactory = null;
try
{
  Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
  if (XPCOMUtils.generateNSGetFactory)
    NSGetFactory = XPCOMUtils.generateNSGetFactory([PXLNotification]);
}
catch(e) { }

} catch(e) { dump('PXLH5N Caught error : '+ e + "\n"); }
