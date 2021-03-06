var data=[], kwh;
var sensorLayout;
var sensorAmount = 3;
var attempt = 1;
$( document ).bind( "mobileinit", function() {
	// Make your jQuery Mobile framework configuration changes here!
	$.mobile.allowCrossDomainPages = false;// THis doesnt help delete it ?
});

$('#home').live('pageinit', function(event, ui) {
    // FILL IN FORM IF DATA EXISTS
		var username = window.localStorage.getItem("username");
		var password = window.localStorage.getItem("password");
		if(username!=null && password!=null){
			$("#txt_username").val(username);
			$("#txt_pwd").val(password);
		}
});

$("a[data-role=tab]").each(function () {
	var anchor = $(this);
	anchor.bind("click", function () {
		$.mobile.changePage(anchor.attr("href"), {
			transition: "none",
			changeHash: false
		});
		return false;
	});
});

$("div[data-role=page]").bind("pagebeforeshow", function (e, data) {
	$.mobile.silentScroll(0);
});
function verifyLogin(){
		var uname=$('#txt_username').val();
		var pwd=$('#txt_pwd').val();
			$.ajax({
						type : 'POST',
						url : 'http://microenergymonitor.com/app/checkLogin.php', // php script URL
						data:{
								'username':uname,
								'password':pwd
						},
			dataType:"text",
						success : function(data) {
						if(data!=="FAIL"){
							window.localStorage.setItem("username", data.username);
							window.localStorage.setItem("password", data.password);
							window.location.href = ('#layout');// Change to tab page defaulting to layout
							console.log("Logged in as "+data.username);
							getData();
						} else {
						// clear the stored password in case that is the problem //
						//localStorage.removeItem("password");
							window.localStorage.setItem("username", "");
							window.localStorage.setItem("password", "");
							$("#txt_pwd").val("");
											alert("Wrong username or password");
									}
							},
							error : function(xhr, type) {
					// clear the stored password in case that is the problem //
					window.localStorage.setItem("username", "");
					window.localStorage.setItem("password", "");
					if(xhr.status==0){var err = "No Connection!";}
					else{var err = xhr.status;}
								alert('Error occurred : '+err+' '+type);
						}
			});
}
function verifyLogin_old(){
    var uname=document.getElementById("txt_username").value;
    var pwd=document.getElementById("txt_pwd").value;
		var url = "http://microenergymonitor.com/app/checkLogin.php";
		var params = "username="+uname+"&password="+pwd;
		var http = new XMLHttpRequest();
		http.open("POST", url, true);

		//Send the proper header information along with the request
		http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

		http.onreadystatechange = function() {//Call a function when the state changes.
			if(http.readyState == 4 && http.status == 200) {
				if(http.responseText!="FAIL"){
					data=$.parseJSON(http.responseText);

					window.localStorage.setItem("username", data.username);
					window.localStorage.setItem("password", data.password);
					window.localStorage.setItem("client_ID", data.client_ID);
					window.localStorage.setItem("store_ID", data.store_ID);

					window.location.href = ('#layout');// Change to tab page defaulting to layout
					console.log("Logged in as "+data.username);
					getData();
				}

			}
		}
		http.send(params);

}

function getData(){
		//set user variables
		var username = window.localStorage.getItem("username");
		var client_ID = window.localStorage.getItem("client_ID");
		var store_ID = window.localStorage.getItem("store_ID");

		var url = "http://microenergymonitor.com/app/allData.php";
		var params = "client_ID="+client_ID+"&store_ID="+store_ID;

		var http = new XMLHttpRequest();
		http.open("POST", url, true);

		//Send the proper header information along with the request
		http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

		http.onreadystatechange = function() {//Call a function when the state changes.
			if(http.readyState == 4){
				if(http.status==200	|| http.status == 0) {
					if(http.responseText!="FAIL"){
						data=$.parseJSON(http.responseText);
						getLayout(data);
					}
				}
			}
		}
		http.send(params);
}



function getLayout(data){

	var client_ID = window.localStorage.getItem("client_ID");
	var store_ID = window.localStorage.getItem("store_ID");
	var file_name = client_ID+"-"+store_ID+".svg";

	///// GEt window width
	var width = $("#layout").width();

		d3.xml("http://microenergymonitor.com/app/layouts/"+file_name, "image/svg+xml", function(xml) {
		d3.select("#svg").style("width", width+"px");
			$('#svg').html(xml.documentElement);

			d3.selectAll(".freezer")
				.style("stroke-width", 2)
				.style("fill", function(){
					var freezerID = this.id.replace("f","");
					var col="grey";
					for(key in data){

						if(data[key].location==freezerID)
						{
						if(data[key].temp > -18)col = "red";
						else if(data[key].temp < -24)col = "blue";
						else col = "green";
						if(!data[key].temp)col = "yellow";
						}

					}
					return col;
				})
				.on("click", function(){
					var freezerID = this.id.replace("f","");
					for(key in data)
					{
						if(data[key].location==freezerID)
						{
						$("#info").html("Freezer : "+data[key].location
							+"<br/>Temp : "+data[key].temp
							+"<br/>Cost : &#8364 "+(data[key].kwh).toFixed(2)
							+"<br/>Brand : "+data[key].brand
							+"<br/>Volume : "+data[key].volume
							);
						$('#dialog').popup('open');
						}
					}
				});



		});
}
function getOverview(){
//set user variables
	var username = window.localStorage.getItem("username");
	var client_ID = window.localStorage.getItem("client_ID");
	var store_ID = window.localStorage.getItem("store_ID");

	var amount = 0, totalCost=0, amountOver=0, amountUnder=0;

	for(key in data){
		if(data[key].temp){
			console.log(key);
			amount++;
			totalCost+= parseFloat(data[key].kwh);
			if(data[key].temp>-18)amountOver++;
			if(data[key].temp<-24)amountUnder++;
		}
	}

	if(amountOver>1)prefix1=' are ';
	else prefix1=' is ';
	if(amountUnder>1)prefix2=' are ';
	else prefix2=' is ';

	$('#overView').html(amount+" freezers monitored. Total Cost :  &#8364 "
		+totalCost.toFixed(2)+" per day.<br/><hr>"
		+amountOver+prefix1+"too warm. "
		+amountUnder+prefix2+"too cold.<br/>");

}
