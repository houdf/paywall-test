	$(document).ready(function() {
		var PayWall = {};
		PayWall.inti = function(option) {
			// *** PayWall.redirectURL : to redirect user inside iframe, 
			//window.location.href; would redirect user to current page 
			PayWall.UserAccount = {};
			//PayWall.redirectURL = "http://houdf.github.io/paywall-test/";
			PayWall.payWallDomain = "http://circpro.mediaspansoftware.com";
			PayWall.payWallLoginPage = "/cgi-bin/WebObjects/CircLogin.woa";
			PayWall.payWallTokenCheck = "/cgi-bin/WebObjects/CircLogin.woa/wa/paywall";

			if (option) {
				$.extend(PayWall.Config, option);
			}

			PayWall.redirectURL = PayWall.Config.redirectURL ;
			

			PayWall.checkStatus();

			console.log("get cookie getUserAccount: ");
			console.log(PayWall.getUserAccount());
			//PayWall.showLoginBox();
			//PayWall.checkIframe();
		}

		PayWall.Config = {
			totalCredit: 10,
			freeContent: 3,
			accountType: "a",
			loginID: "#logIn",
			userStatus: "#user-status",
			showLog: false,
			redirectURL: ""

		}

		PayWall.setConfig = {
			// witht ajax and jsonp 
		}

		PayWall.checkStatus = function() {
			var userStat = PayWall.getUserAccount();
			console.log("userStat: " + userStat);
			if (userStat !== "notset") {
				PayWall.UserAccount = userStat;
				console.log("checkStatus,  PayWall.UserAccount:userStat");
				console.log(PayWall.UserAccount);
				PayWall.authenticateByToken(userStat.token);
			} else {
				PayWall.resetCredit();
				console.log("checkStatus,  PayWall.UserAccount:");
				console.log(PayWall.UserAccount);
				PayWall.authenticateByForm();
			}
		}

		PayWall.getUserAccount = function() {
			var userAccount = PayWall.getCookie("useraccount");
			if (userAccount != null && userAccount != "") {
				console.log(PayWall.UserAccount);
				console.log("userAccount: " + userAccount);

				var userAccountJson = $.parseJSON(userAccount);
				PayWall.UserAccount = userAccountJson;
				console.log("getStatus: " + PayWall.UserAccount);
				return userAccountJson;
			} else {
				return "notset";
			}

		}

		PayWall.setUserAccountToken = function(newtoken) {

			PayWall.UserAccount.token = newtoken;
			PayWall.saveUserAccount();
		}

		PayWall.resetCredit = function() {

			PayWall.UserAccount.usedCredit = 0;
			console.log(PayWall.UserAccount.usedCredit);
			console.log("resetCredit PayWall.UserAccount.usedCredit:");
			console.log(PayWall.UserAccount.usedCredit);
			PayWall.saveUserAccount();
		}

		PayWall.addUsedCredit = function() {

			PayWall.UserAccount.usedCredit += 1;
			PayWall.saveUserAccount();
		}


		PayWall.saveUserAccount = function() {
			//var root = $.parseJSON(cookieStr);
			//root.products.push(newProduct);
			var cookieStr = JSON.stringify(PayWall.UserAccount);
			PayWall.setCookie("useraccount", cookieStr);
		}

		PayWall.authorizeUser = function() {

			if (PayWall.Config.accountType === "a") {
				console.log("authorizeUser Status.usedCredit" + PayWall.UserAccount.usedCredit);
				PayWall.addUsedCredit();
				console.log(PayWall.UserAccount.usedCredit);
				var totalCer = PayWall.Config.totalCredit; //+ PayWall.Config.freeContent;
				if (PayWall.UserAccount.usedCredit <= totalCer) {
					parent.$.fancybox.close();
					$(PayWall.Config.loginID).hide();
					if (PayWall.Config.showLog) {
						$(PayWall.Config.userStatus).append("<div> Total Credit: " + PayWall.Config.totalCredit + "</div>");
						//$(PayWall.Config.userStatus).append("<div> Free Credit: " + PayWall.Config.freeContent + "</div>");

						$(PayWall.Config.userStatus).append("<div> Used Credit: " + PayWall.UserAccount.usedCredit + "</div>");
					}


				} else {
					alert("you need more credit....");
					// show new box...
				}

			}
		}

		PayWall.authenticateByForm = function() {
			PayWall.showLoginBox();
			PayWall.checkIframe();
		}

		PayWall.authenticateByToken = function(token) {

			var mdAPI = PayWall.payWallDomain + PayWall.payWallTokenCheck + "?token=" + token;
			//console.log( "mdAPI: " + mdAPI);
			$.ajax({
				type: 'GET',
				url: mdAPI,
				async: false,
				jsonpCallback: 'jsonCallback',
				contentType: "application/json",
				dataType: 'jsonp',
				success: function(json) {
					$(PayWall.Config.userStatus).text("Welcome, " + json.firstname);
					//console.dir(json);
					if (json.status !== "invalid") {
						$.extend(PayWall.UserAccount, json);
						console.log("PayWall.UserAccount, json :");
						console.log(PayWall.UserAccount);
						PayWall.saveUserAccount();
						//PayWall.setStatusToken(json.token);
						PayWall.authorizeUser();

					} else {
						PayWall.authenticateByForm();
					}
				},
				error: function(e) {
					// console.log(e.message);
				}
			});
		}

		PayWall.showLoginBox = function() {

			var loginUrl = PayWall.payWallDomain + PayWall.payWallLoginPage + "?redurl=" + PayWall.redirectURL;
			//console.log(loginUrl);		
			$("#logIn").fancybox({
				'width': '75%',
				'height': '75%',
				'autoScale': false,
				'transitionIn': 'none',
				'transitionOut': 'none',
				'type': 'iframe',
				'modal': true,
				'overlayOpacity': 0.9,
				'href': loginUrl,
				'title': 'Login / Subscribe'				
			}).trigger('click');
		}

		PayWall.checkIframe = function() {
			$('#fancybox-frame').load(function() {

				var tokenAPI = "notset";
				//$('#fancybox-frame').contents().find("body").hide();
				var srcurl = $('#fancybox-frame').contents().get(0).location.href;
				//console.log( "srcurl" + srcurl);
				tokenAPI = (PayWall.getQueryVariable("token", srcurl));
				console.log("tokenAPI" + tokenAPI);
				if (tokenAPI !== "notset") {

					PayWall.authenticateByToken(tokenAPI);
				}

			});
		}

		PayWall.getQueryVariable = function(variable, url) {
			var query = url.split("?");
			var vars = query[1].split("&");
			for (var i = 0; i < vars.length; i++) {
				var pair = vars[i].split("=");
				if (pair[0] == variable) {
					return pair[1];
				}
			}
			return (false);
		}

		PayWall.setCookie = function(c_name, value, exdays) {
			var exdate = new Date();
			exdate.setDate(exdate.getDate() + exdays);
			var c_value = escape(value) + ((exdays == null) ? "" : "; expires=" + exdate.toUTCString());
			document.cookie = c_name + "=" + c_value;
		}

		PayWall.getCookie = function(c_name) {
			var c_value = document.cookie;
			var c_start = c_value.indexOf(" " + c_name + "=");
			if (c_start == -1) {
				c_start = c_value.indexOf(c_name + "=");
			}
			if (c_start == -1) {
				c_value = null;
			} else {
				c_start = c_value.indexOf("=", c_start) + 1;
				var c_end = c_value.indexOf(";", c_start);
				if (c_end == -1) {
					c_end = c_value.length;
				}
				c_value = unescape(c_value.substring(c_start, c_end));
			}
			return c_value;
		}



		PayWall.inti({
			totalCredit: 500,
			freeContent: 3,
			loginID: "#logIn",
			userStatus: "#user-status",
			redirectURL: "http://houdf.github.io/paywall-test/"
		});

	});