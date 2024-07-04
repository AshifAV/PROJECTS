sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/BusyIndicator",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"sap/ui/model/json/JSONModel"
], function (Controller, BusyIndicator, MessageToast, MessageBox, JSONModel) {
	'use strict';

	var serviceUrl = "/sap/opu/odata/sap/ZMM_GRN_PROCESS_SRV_01";
	var hData;
	var purno;
	var itm_cd;
	var flag = false;
	var bool = false;
	var items = [];
	var quantity;
	var header = {};
	header.NP_ON_EBELN = [];
	var FTable = [];
	var UTable = [];
	var data;
	var itemData;
	var fdesc;
	var REF;
	var docType;
	var first = false;
	var itemNumber;
	var dtFlag;
	var count = 0;
	var items = [];
	var Table;
	var maxqty;
	var grnqty;

	return Controller.extend("com.jaleel.grn.controller.Grnpo", {

		onInit: function () {

			var testData = [];
			var oModel = new sap.ui.model.json.JSONModel({
				data: testData
			});
			this.getView().setModel(oModel);

			var UIStateModel = new JSONModel();
			var UIStateData = {
				visible: false
			};
			UIStateModel.setData(UIStateData);
			this.getView().setModel(UIStateModel, "UIState");

			var router = sap.ui.core.UIComponent.getRouterFor(this);
			router.getRoute("grnpo").attachPatternMatched(this.onObjectMatched, this);
			jQuery.sap.delayedCall(500, this, function() { this.getView().byId("inp_ean").focus(); }); 

		},

		onObjectMatched: function (oEvent) {

			hData = oEvent.getParameter("arguments");
			purno = hData.poNumber;
			REF = hData.REF;
			docType = hData.docType;     
			
			if(docType == "D"){
				
				this.getView().byId("inp_foc").setEnabled(false); 
				
			}

		},

		validateItem: function () {
			debugger;
			flag = false;

			this.getView().byId("inp_foc").setValueState('None');
			this.getView().byId("inp_qty").setValueState('None');
			this.getView().byId("inp_ean").setValueState('None');
			var that = this;
			var eanNo = parseInt(that.getView().byId("inp_ean").getValue());

			var eanModel = new sap.ui.model.json.JSONModel();
			var oEanNo = new sap.ui.model.odata.ODataModel(serviceUrl, true);
			oEanNo.read("/PODetailsSet?$filter=PurchaseOrd eq '" + hData.poNumber + "' and EanNo eq '" + eanNo + "' and StoInd eq '"+docType+"'", null, null, true,
				function (oData, oResponse) {
					eanModel.setData({
						uanNo: oData.results
					});
					data = eanModel.getProperty("/uanNo");
					count = data[0].Noitems;
					maxqty = data[0].PoQty;
					grnqty = data[0].GrnQty;
					that.getView().byId("inp_item").setText(data[0].ArticleCode);
					that.getView().byId("inp_desc").setText(data[0].ArticleDesc);
					that.getView().byId("inp_sl").setText(data[0].StorageLoc);
					that.getView().byId("inp_uom").setText(data[0].UOM);
					that.getView().byId("inp_np").setText("Net Price: " + data[0].NetPrice);
					that.getView().byId("inp_qty").focus();
					// that.getView().byId("inp_maxquant").setText(data[0].Quantity);
					itemNumber = data[0].ItemNo;
					dtFlag = data[0].FLAG;

					if (data[0].FLAG == 'X') {

						var UIStateModel = that.getView().getModel("UIState");
						var UIStateData = UIStateModel.getData();
						UIStateData.visible = true;
						UIStateModel.setData(UIStateData);
						flag = true;

					} else {

						var UIStateModel = that.getView().getModel("UIState");
						var UIStateData = UIStateModel.getData();
						UIStateData.visible = false;
						UIStateModel.setData(UIStateData);

					}

				},
				function (oResponse) {
					var oBody = JSON.parse(oResponse.response.body);
					that.getView().byId("inp_ean").setValueState("Error");
					that.getView().byId("inp_ean").setValueStateText(oBody.error.innererror.errordetails[0].message);
					that.getView().byId("inp_item").setText("");
					that.getView().byId("inp_desc").setText("");
					that.getView().byId("inp_sl").setText("");
					that.getView().byId("inp_qty").setValue("");
					// that.getView().byId("inp_maxquant").setText("");
				});

		},

		focus: function(){

			this.getView().byId("btn").focus();

		},

		onAddItem: function () {

			var bool = false;
			var that = this;
			var updHeader = {};
			var UTable = [];
			updHeader.NP_ON_EBELN = [];
			var itemData = [];

			that.getView().byId("inp_ean").setValueState('None');
			that.getView().byId("inp_qty").setValueState('None');
			var Table = that.getView().byId("idtb").getModel().getData();
			var tbl = that.getView().byId("idtb").getModel();
			items = tbl.getProperty("/data");

			var code = that.getView().byId("inp_item").getText();
			
			var len = items.length;
			var inpquant = Number(this.getView().byId("inp_qty").getValue()).toFixed(3);
			for (var i = 0; i < items.length; i++) {
				if (Table.data[i].Item == code) {
					bool = true;
					if (Number(Table.data[i].Qty) < Number(maxqty)) {
						if (grnqty == "0") {
							var rem = Number(maxqty) - (Number(Table.data[i].Qty) + Number(inpquant));
						} else {
							var rem = Number(maxqty) - (Number(grnqty) + Number(Table.data[i].Qty) + Number(inpquant));
						}
					}
				}
			}


			if (bool == false) {
				if (grnqty == "0") {
					var rem = Number(maxqty) - Number(inpquant);
				}
				else {
					var rem = Number(maxqty) - (Number(grnqty) + Number(inpquant));
				}
				bool = true;
			}
			if(rem>0)
			{
			MessageBox.warning("Do you want to continue ?", {
				actions: [MessageBox.Action.YES, MessageBox.Action.NO],
				title: rem + " quantity is still pending",
				emphasizedAction: MessageBox.Action.OK,
				onClose: function (sAction) {

					if (sAction == "YES") {

						var Table = that.getView().byId("idtb").getModel().getData();
						var tbl = that.getView().byId("idtb").getModel();
						items = tbl.getProperty("/data");

						var chk = that.getView().byId("inp_foc").getSelected();

						if (chk == true) {
							var foc = 'X';
						} else {
							var foc = '';
						}

						var validation = that.Validations();
						if (validation == true) {

							updHeader.PONO = hData.poNumber;
							updHeader.REF = hData.REF;
							updHeader.StoInd = docType;            
							updHeader.ItemNo = itemNumber;
							var x = parseInt(that.getView().byId("inp_ean").getValue());
							updHeader.EanNo = x.toString();
							updHeader.ArticleCode = that.getView().byId("inp_item").getText();
							updHeader.ArticleDesc = that.getView().byId("inp_desc").getText();
							updHeader.Quantity = Number(that.getView().byId("inp_qty").getValue()).toFixed(3);
							updHeader.UOM = that.getView().byId("inp_uom").getText();
							updHeader.StorageLoc = that.getView().byId("inp_sl").getText();
							updHeader.ProdDate = that.getView().byId("inp_pd").getValue();
							updHeader.ExpiryDate = that.getView().byId("inp_ed").getValue();
							updHeader.FOC = foc;
							updHeader.FLAG = dtFlag;
							updHeader.matdoc = '0'; // for understanding its add item
							if (items.length == 0) {

								updHeader.NP_ON_EBELN = [];

							} else {

								for (var i = 0; i < len; i++) {
									var items = {};
									items.ItemNo = Table.data[i].ItemNo;
									items.EanNo = Table.data[i].Ean;
									items.ArticleCode = Table.data[i].Item;
									items.ArticleDesc = Table.data[i].Desc;
									items.Quantity = Table.data[i].Qty;
									items.UOM = Table.data[i].UOM;
									items.StorageLoc = Table.data[i].StorLoc;
									items.ProdDate = Table.data[i].Pdate;
									items.ExpriyDate = Table.data[i].Edate;
									items.FOC = Table.data[i].Foc;
									items.FLAG = Table.data[i].FLAG;
									items.Base_Uom = Table.data[i].Baseuom;
									items.Base_Qty = Table.data[i].Baseqty;
									UTable.push(items);
								}
								updHeader.NP_ON_EBELN = UTable;
							}

							that.getView().byId("inp_ean").setValue("");
							that.getView().byId("inp_item").setText("");
							that.getView().byId("inp_desc").setText("");
							that.getView().byId("inp_uom").setText("");
							that.getView().byId("inp_np").setText("");
							that.getView().byId("inp_sl").setText("");
							that.getView().byId("inp_qty").setValue("");
							that.getView().byId("inp_foc").setSelected(false);
							// that.getView().byId("inp_maxquant").setText("");

							if (flag == true) {

								that.getView().byId("inp_pd").setValue("");
								that.getView().byId("inp_ed").setValue("");

							}

							var oEanNo = new sap.ui.model.odata.ODataModel(serviceUrl, true);

							oEanNo.create("/PurchaseOrderNoSet", updHeader, {
								method: "ADD",
								success: jQuery.proxy(function (oData, response) {

									var oModel = that.getView().byId("idtb").getModel();
									for (var i = 0; i < oData.NP_ON_EBELN.results.length; i++) {

										var itemRow = {

											ItemNo: oData.NP_ON_EBELN.results[i].ItemNo,
											Ean: oData.NP_ON_EBELN.results[i].EanNo,
											Item: oData.NP_ON_EBELN.results[i].ArticleCode,
											Desc: oData.NP_ON_EBELN.results[i].ArticleDesc,
											UOM: oData.NP_ON_EBELN.results[i].UOM,
											Qty: oData.NP_ON_EBELN.results[i].Quantity,
											StorLoc: oData.NP_ON_EBELN.results[i].StorageLoc,
											Pdate: oData.NP_ON_EBELN.results[i].ProdDate,
											Edate: oData.NP_ON_EBELN.results[i].ExpriyDate,
											Foc: oData.NP_ON_EBELN.results[i].FOC,
											Baseuom: oData.NP_ON_EBELN.results[i].Base_Uom,
											Baseqty: oData.NP_ON_EBELN.results[i].Base_Qty

										};

										itemData.push(itemRow);

									}

									if (itemData[0].Desc == "") {

										itemData.shift();

									}

									oModel.setData({
										data: itemData
									});

									that.getView().byId("idtb").setVisible(true);
									that.getView().byId("inp_ean").focus();

								}),
								error: function (response) {

									var msg = JSON.parse(response.response.body)["error"].message.value;
									sap.m.MessageBox.show(msg);

								}
							});
						}
					}
				}
			});
		}

		else
		{


			var Table = that.getView().byId("idtb").getModel().getData();
			var tbl = that.getView().byId("idtb").getModel();
			items = tbl.getProperty("/data");

			var chk = that.getView().byId("inp_foc").getSelected();

			if (chk == true) {
				var foc = 'X';
			} else {
				var foc = '';
			}

			var validation = that.Validations();
			if (validation == true) {

				updHeader.PONO = hData.poNumber;
				updHeader.REF = hData.REF;
				updHeader.StoInd = docType;  
				updHeader.ItemNo = itemNumber;
				var x = parseInt(that.getView().byId("inp_ean").getValue());
				updHeader.EanNo = x.toString();
				updHeader.ArticleCode = that.getView().byId("inp_item").getText();
				updHeader.ArticleDesc = that.getView().byId("inp_desc").getText();
				updHeader.Quantity = Number(that.getView().byId("inp_qty").getValue()).toFixed(3);
				updHeader.UOM = that.getView().byId("inp_uom").getText();
				updHeader.StorageLoc = that.getView().byId("inp_sl").getText();
				updHeader.ProdDate = that.getView().byId("inp_pd").getValue();
				updHeader.ExpiryDate = that.getView().byId("inp_ed").getValue();
				updHeader.FOC = foc;
				updHeader.FLAG = dtFlag;
				updHeader.matdoc = '0'; // for understanding its add item
				if (items.length == 0) {

					updHeader.NP_ON_EBELN = [];

				} else {

					for (var i = 0; i < len; i++) {
						var items = {};
						items.ItemNo = Table.data[i].ItemNo;
						items.EanNo = Table.data[i].Ean;
						items.ArticleCode = Table.data[i].Item;
						items.ArticleDesc = Table.data[i].Desc;
						items.Quantity = Table.data[i].Qty;
						items.UOM = Table.data[i].UOM;
						items.StorageLoc = Table.data[i].StorLoc;
						items.ProdDate = Table.data[i].Pdate;
						items.ExpriyDate = Table.data[i].Edate;
						items.FOC = Table.data[i].Foc;
						items.FLAG = Table.data[i].FLAG;
						items.Base_Uom = Table.data[i].Baseuom;
						items.Base_Qty = Table.data[i].Baseqty;
						UTable.push(items);
					}
					updHeader.NP_ON_EBELN = UTable;
				}

				that.getView().byId("inp_ean").setValue("");
				that.getView().byId("inp_item").setText("");
				that.getView().byId("inp_desc").setText("");
				that.getView().byId("inp_uom").setText("");
				that.getView().byId("inp_np").setText("");
				that.getView().byId("inp_sl").setText("");
				that.getView().byId("inp_qty").setValue("");
				that.getView().byId("inp_foc").setSelected(false);
				// that.getView().byId("inp_maxquant").setText("");

				if (flag == true) {

					that.getView().byId("inp_pd").setValue("");
					that.getView().byId("inp_ed").setValue("");

				}

				var oEanNo = new sap.ui.model.odata.ODataModel(serviceUrl, true);

				oEanNo.create("/PurchaseOrderNoSet", updHeader, {
					method: "ADD",
					success: jQuery.proxy(function (oData, response) {

						var oModel = that.getView().byId("idtb").getModel();
						for (var i = 0; i < oData.NP_ON_EBELN.results.length; i++) {

							var itemRow = {

								ItemNo: oData.NP_ON_EBELN.results[i].ItemNo,
								Ean: oData.NP_ON_EBELN.results[i].EanNo,
								Item: oData.NP_ON_EBELN.results[i].ArticleCode,
								Desc: oData.NP_ON_EBELN.results[i].ArticleDesc,
								UOM: oData.NP_ON_EBELN.results[i].UOM,
								Qty: oData.NP_ON_EBELN.results[i].Quantity,
								StorLoc: oData.NP_ON_EBELN.results[i].StorageLoc,
								Pdate: oData.NP_ON_EBELN.results[i].ProdDate,
								Edate: oData.NP_ON_EBELN.results[i].ExpriyDate,
								Foc: oData.NP_ON_EBELN.results[i].FOC,
								Baseuom: oData.NP_ON_EBELN.results[i].Base_Uom,
								Baseqty: oData.NP_ON_EBELN.results[i].Base_Qty

							};

							itemData.push(itemRow);

						}

						if (itemData[0].Desc == "") {

							itemData.shift();

						}

						oModel.setData({
							data: itemData
						});

						that.getView().byId("idtb").setVisible(true);
						that.getView().byId("inp_ean").focus();

					}),
					error: function (response) {

						var msg = JSON.parse(response.response.body)["error"].message.value;
						sap.m.MessageBox.show(msg);

					}
				});
			}


		}



		},

		Validations: function () {

			var EanNo = this.getView().byId("inp_ean").getValue();
			var Qty = this.getView().byId("inp_qty").getValue();

			if (EanNo == "") {

				this.getView().byId("inp_ean").setValueState("Error");
				this.getView().byId("inp_ean").setValueStateText("Please enter EAN Number");
				return false;

			}

			if (Qty == "" || (Qty.toString().length - (Qty.toString().indexOf('.') + 1)) > 3) {

				this.getView().byId("inp_qty").setValueState("Error");
				this.getView().byId("inp_qty").setValueStateText("Invalid Quantity");
				return false;

			}

			return true;

		},

		onClear: function () {
			this.getView().byId("inp_ean").setValue("");
			this.getView().byId("inp_sl").setText("");
			this.getView().byId("inp_qty").setValue("");
			this.getView().byId("inp_item").setText("");
			this.getView().byId("inp_desc").setText("");
			this.getView().byId("inp_qty").setValue("");
			this.getView().byId("inp_uom").setText("");
			// this.getView().byId("inp_maxquant").setText("");
			this.getView().byId("inp_pd").setValue("");
			this.getView().byId("inp_ed").setValue("");

		},

		deleteRow: function () {

			var deleteRecord = this.getView().byId("idtb");
			var items = deleteRecord.getItems();
			var oTablemodel = this.getView().getModel();
			var aRows = oTablemodel.getData().data;
			var aContexts = deleteRecord.getSelectedContexts();
			if (items.length > 0 && deleteRecord.getSelectedContexts().length > 0) {
				sap.m.MessageBox.warning("Do you want to delete the Item?", {
					actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
					emphasizedAction: sap.m.MessageBox.Action.OK,
					onClose: function (sAction) {
						if (sAction === sap.m.MessageBox.Action.OK) {
							var that = this;
							for (var i = deleteRecord.getSelectedContexts().length - 1; i >= 0; i--) {
								var oThisObj = aContexts[i].getObject();
								var index = $.map(aRows, function (obj, index) {
									if (obj === oThisObj) {
										return index;
									}
								});
								aRows.splice(index, 1);
								oTablemodel.refresh();
							}
							deleteRecord.removeSelections(true);
						}
					}
				});
			} else {
				sap.m.MessageBox.warning("Please select atleast one Item to delete.");
			}
		},

		onNavBack: function () {

			var that = this;
			sap.m.MessageBox.warning("Are you sure you want to go back?", {
				actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
				emphasizedAction: sap.m.MessageBox.Action.OK,
				onClose: function (sAction) {
					if (sAction === sap.m.MessageBox.Action.OK) {
						that.getOwnerComponent().getRouter().navTo("apphome");
						window.location.reload();
					} else { }
				}
			});

		},

		onSubmit: function () {

			items = this.getView().byId("idtb").getItems();
			Table = this.getView().byId("idtb").getModel().getData();
			var len = items.length;
			if (items.length != 0) {
				if (count > items.length) {

					MessageBox.warning("Do you want to continue ? ", {
						actions: [MessageBox.Action.YES, MessageBox.Action.NO],
						title: count - 1 + " articles are still open for GRN",
						emphasizedAction: MessageBox.Action.OK,
						onClose: function (sAction) {

							if (sAction == "YES") {
								var path = "/PurchaseOrderNoSet";
								var FTable = [];
								// var len = items.length;
								var GRNno;
								header.PONO = hData.poNumber;
								header.REF = hData.REF;
								header.StoInd = docType;  
								for (var i = 0; i < len; i++) {
									var items = {};
									items.PurchaseOrd = hData.poNumber;
									items.ItemNo = Table.data[i].ItemNo;
									items.EanNo = Table.data[i].Ean;
									items.ArticleCode = Table.data[i].Item;
									items.ArticleDesc = Table.data[i].Desc;
									items.Quantity = Table.data[i].Qty;
									items.UOM = Table.data[i].UOM;
									items.StorageLoc = Table.data[i].StorLoc;
									items.ProdDate = Table.data[i].Pdate;
									items.ExpriyDate = Table.data[i].Edate;
									items.FOC = Table.data[i].Foc;
									items.FLAG = '';
									FTable.push(items);
								}
								header.NP_ON_EBELN = FTable;
								var that = this;
								sap.ui.core.BusyIndicator.show(0);
								jQuery.sap.delayedCall(2500, this, function (oEvent) {
									var model = new sap.ui.model.odata.ODataModel(serviceUrl, true);

									model.create(path, header, {
										method: "POST",
										success: jQuery.proxy(function (oData, response) {
											sap.ui.core.BusyIndicator.hide();
											GRNno = response.data.matdoc;
											var message = "Goods Reciept Note" + " " + GRNno + " " + "has been created.";

											sap.m.MessageBox.success(message, {
												icon: sap.m.MessageBox.Icon.SUCCESS,
												title: "Success",
												actions: [sap.m.MessageBox.Action.OK],
												onClose: function (sButton) {
													if (sButton === sap.m.MessageBox.Action.OK) {
														that.getView().byId("idtb").getModel().setData("");
														// window.location.reload();
													}
												}.bind(this)
											});

										}),
										error: function (response) {
											sap.ui.core.BusyIndicator.hide();
											var msg = JSON.parse(response.response.body)["error"].message.value;

											sap.m.MessageBox.error(msg, {
												icon: sap.m.MessageBox.Icon.ERROR,
												title: "ERROR",
												actions: [sap.m.MessageBox.Action.OK],
												onClose: function (sButton) {
													if (sButton === sap.m.MessageBox.Action.OK) {
														that.getView().byId("idtb").getModel().setData("");
														// window.location.reload();
													}
												}.bind(this)
											});
										}
									});
									sap.ui.core.BusyIndicator.hide();
								});
							}
						}
					});

				} else {

					Table = this.getView().byId("idtb").getModel().getData();
					items = this.getView().byId("idtb").getItems();
					var path = "/PurchaseOrderNoSet";
					var FTable = [];
					var len = items.length;
					var GRNno;
					header.PONO = hData.poNumber;
					header.REF = hData.REF;
					header.StoInd = docType;  
					for (var i = 0; i < len; i++) {
						var items = {};
						items.PurchaseOrd = hData.poNumber;
						items.ItemNo = Table.data[i].ItemNo;
						items.EanNo = Table.data[i].Ean;
						items.ArticleCode = Table.data[i].Item;
						items.ArticleDesc = Table.data[i].Desc;
						items.Quantity = Table.data[i].Qty;
						items.UOM = Table.data[i].UOM;
						items.StorageLoc = Table.data[i].StorLoc;
						items.ProdDate = Table.data[i].Pdate;
						items.ExpriyDate = Table.data[i].Edate;
						items.FOC = Table.data[i].Foc;
						items.FLAG = '';
						FTable.push(items);
					}
					header.NP_ON_EBELN = FTable;
					var that = this;
					sap.ui.core.BusyIndicator.show(0);
					jQuery.sap.delayedCall(2500, this, function (oEvent) {
						var model = new sap.ui.model.odata.ODataModel(serviceUrl, true);

						model.create(path, header, {
							method: "POST",
							success: jQuery.proxy(function (oData, response) {
								sap.ui.core.BusyIndicator.hide();
								GRNno = response.data.matdoc;
								var message = "Goods Reciept Note" + " " + GRNno + " " + "has been created.";

								sap.m.MessageBox.success(message, {
									icon: sap.m.MessageBox.Icon.SUCCESS,
									title: "Success",
									actions: [sap.m.MessageBox.Action.OK],
									onClose: function (sButton) {
										if (sButton === sap.m.MessageBox.Action.OK) {
											that.getView().byId("idtb").getModel().setData("");
											//window.location.reload();
										}
									}.bind(this)
								});

							}),
							error: function (response) {
								sap.ui.core.BusyIndicator.hide();
								var msg = JSON.parse(response.response.body)["error"].message.value;

								sap.m.MessageBox.error(msg, {
									icon: sap.m.MessageBox.Icon.ERROR,
									title: "ERROR",
									actions: [sap.m.MessageBox.Action.OK],
									onClose: function (sButton) {
										if (sButton === sap.m.MessageBox.Action.OK) {
											// that.getView().byId("idtb").getModel().setData("");
											// window.location.reload();
										}
									}.bind(this)
								});
							}
						});
						sap.ui.core.BusyIndicator.hide();
					});

				}
			} else {

				sap.m.MessageBox.warning("Please add an item for goods reciept note", {
					title: "Warning", // default
					onClose: null, // default
					styleClass: "", // default
					actions: sap.m.MessageBox.Action.OK, // default
					emphasizedAction: sap.m.MessageBox.Action.OK, // default
					initialFocus: null, // default
					textDirection: sap.ui.core.TextDirection.Inherit // default
				});

			}
		}

	});
});