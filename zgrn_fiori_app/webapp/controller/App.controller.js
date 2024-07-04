sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"jquery.sap.global",
	"sap/m/Dialog",
	"sap/m/Button",
	"sap/m/MessageToast",
	"sap/ui/core/Fragment",
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/FilterType",
	"sap/m/MessageBox"
], function(Controller, JQuery, Dialog, Button, MessageToast, Fragment, JSONModel, Device, Filter, FilterOperator, FilterType, MessageBox) {

	"use strict";
	var serviceUrl = "/sap/opu/odata/sap/ZMM_GRN_PROCESS_SRV_01";
	var docType;
	var companyCode;
	var purchaseOrderSetModel;
	var country;
	var currency;
	var ccDesc;
	var doc_type;

	return Controller.extend("com.jaleel.grn.App", {

		onInit: function() {

			// var that = this;
			var search = {
				edit: false
			};
			var oModel = new sap.ui.model.json.JSONModel();
			oModel.setData(search);
			this.getView().setModel(oModel, "search");
			jQuery.sap.delayedCall(500, this, function() { this.getView().byId("_input1").focus(); }); 

		},
		
		focus: function() {
			
			jQuery.sap.delayedCall(500, this, function() { this.getView().byId("_input2").focus(); });
			
		},


		onPressOk: function(oEvent) {
			debugger;

			var validation = this.Validations();
			if (validation == true) {
				var that = this;
				if(that.getView().byId("doc_type_inp").getSelectedKey() == "1")
				{
					doc_type = "P";
				}
				else
				{
					doc_type = "D";
				}
				var poNo = that.getView().byId("_input1").getValue();
				var ref = that.getView().byId("_input2").getValue();
				var poModel = new sap.ui.model.json.JSONModel();
				var oPoNo = new sap.ui.model.odata.ODataModel(serviceUrl, true);
				oPoNo.read("/PurchaseOrderNoSet?$filter=PONO eq '" + poNo + "' and StoInd eq '" +doc_type+ "'", null, null, true, function(oData, oResponse) {
					poModel.setData({
						poNo: oData.results
					});

					var oRouter = that.getOwnerComponent().getRouter();
					oRouter.navTo("grnpo", {
						"poNumber": poNo,
						"REF"     : ref,
						"docType" : doc_type
					});

				}, function(oResponse) {
					var oBody = JSON.parse(oResponse.response.body);
					that.getView().byId("_input1").setValueState("Error");
					that.getView().byId("_input1").setValueStateText(oBody.error.innererror.errordetails[0].message);
					MessageToast.show(oBody.error.innererror.errordetails[0].message);
					that.getView().byId("_input1").setValue("");
					that.getView().byId("_input2").setValue("");
					that.getView().byId("_input1").focus();

					// sap.m.MessageToast.show(oBody.error.innererror.errordetails[0].message);
				});
			}

		},

		Validations: function() {

			var DocNo = this.getView().byId("_input1").getValue();
			var Ref = this.getView().byId("_input2").getValue();

			if (DocNo === "") {
				this.getView().byId("_input1").setValueState("Error");
				this.getView().byId("_input1").setValueStateText("Please scan or enter the Purchase Order Number");
				MessageToast.show("Please scan or enter the Purchase Order Number");
				return false;
			} else {
				this.getView().byId("_input1").setValueStateText("");
				this.getView().byId("_input1").setValueState("None");
			}

			if (Ref === "") {
				this.getView().byId("_input2").setValueState("Error");
				this.getView().byId("_input2").setValueStateText("Please enter reference number");
				return false;
			} else {
				this.getView().byId("_input2").setValueStateText("");
				this.getView().byId("_input2").setValueState("None");
			}
			return true;

		},

		onClear: function() {
			this.getView().byId("_input1").setValue("");
			this.getView().byId("_input2").setValue("");

		}

	});
});