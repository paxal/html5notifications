// Settings JS File

var PXLPermissions = Components.classes['@paxal.net/html5notifications/notification-service;1']
  .getService().QueryInterface(Components.interfaces.nsIPXLNotificationService);

var PXLSettings =
{
	labels:
	{
		0: 'Allowed',
		2: 'Denied'
	},

	'init': function()
	{
		// Private browsing mode ?
		if(!PXLPermissions.getPrivateBrowsingMode())
		{
			// Off !
			document.getElementById('privateBrowsingModeOn').hidden = true;
		}

		// Get localizations
		this.labels[0] = this.getLocalizedString('settings.allowed');
		this.labels[2] = this.getLocalizedString('settings.denied');

		// Initialize permissions
		this.fillWithFilter();
	},

	fillWithFilter: function(filter)
	{
		var theList = document.getElementById('permissionsList');
		while(theList.getRowCount()) theList.removeItemAt(0);

		if(!filter) filter = '';

		var permissions = PXLPermissions.listPermissions();

		for(var host in permissions)
		{
			var visible = filter.length == 0 || (host.indexOf(filter) != -1);
			if(!visible) continue;

			var val = permissions[host];
			var label = this.labels[val];

			var row = document.createElement('listitem');
			var cell = document.createElement('listcell');
			cell.setAttribute('label', host);
			row.setAttribute('host', host);
			row.appendChild(cell);

			cell = document.createElement('listcell');
			cell.setAttribute('label', label);
			row.setAttribute('label', label);
			row.appendChild(cell);

			theList.appendChild(row);
		}

		// Sort
		var xs = Components.classes["@mozilla.org/xul/xul-sort-service;1"].
			getService(Components.interfaces.nsIXULSortService);
		xs.sort(theList, "host", "ascending");
	},

	unsetPermission: function()
	{
		var theList = document.getElementById('permissionsList');
		var el;
		while(el = theList.getSelectedItem(0))
		{
			this.removeByItem(el);
		}
	},

	removeByItem: function(el)
	{
		var theList = document.getElementById('permissionsList');
		PXLPermissions.unsetPermission(el.firstChild.getAttribute('label'));
		theList.removeItemFromSelection(el);
		var listIndex = theList.getIndexOfItem(el);
		theList.removeItemAt(listIndex);
	},

	unsetAllPermissions: function()
	{
		var theList = document.getElementById('permissionsList');
		if(!theList.getRowCount()) return;

		var ret = confirm(this.getLocalizedString('settings.remove.all'));
		if(!ret) return;

		var el;
		while(el = theList.getItemAtIndex(0))
		{
			this.removeByItem(el);
		}
	},

  getLocalizedString: function(key, strArray)
  {
    var stringBundle = document.getElementById('pxl-notifications-bundle');
    if(strArray)
    {
      return stringBundle.getFormattedString(key, strArray);
    }
    else
    {
      return stringBundle.getString(key);
    }
  }
}

// Initialize
window.addEventListener('load', function() { PXLSettings.init(); }, false);
