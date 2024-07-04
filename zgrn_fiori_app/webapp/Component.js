sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/model/json/JSONModel"

], function (UIComponent, JSONModel) {
	"use strict";
	return UIComponent.extend("com.jaleel.grn.Component", {
		metadata : {
			manifest : "json",
			"includes": ["css/style.css"]
		},
		
		init : function () {
			// call the init function of the parent
			UIComponent.prototype.init.apply(this, arguments);
			this.getRouter().initialize();
			// set dialog
		}
	});
});