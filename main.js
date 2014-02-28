var data=[], kwh;
var sensorLayout;
sensorAmount = 3;

$( document ).bind( "mobileinit", function() {
	// Make your jQuery Mobile framework configuration changes here! 
	$.mobile.allowCrossDomainPages = false;// THis doesnt help delete it ?
});
	
$('#home').live('pageinit', function(event, ui) {
        /* // FILL IN FORM IF DATA EXISTS
		var username = window.localStorage.getItem("username");
		var password = window.localStorage.getItem("password");
		if(username!=null && password!=null){
			$("#txt_username").val(username);
			$("#txt_pwd").val(password);
		}
		*/
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
    var uname=document.getElementById("txt_username").value;
    var pwd=document.getElementById("txt_pwd").value;   
	console.log("logging on"+uname+" "+pwd);
      $.ajax({
            type : 'POST',          
            url : 'http://microenergymonitor.com/app/checkLogin.php', // php script URL          
            data:{
                'username':uname,
                'password':pwd
            },
			dataType:"json",
            success : function(data) {  
				data= data;
				
                if(data!=="FAIL"){
					window.localStorage.setItem("username", data.username);
					window.localStorage.setItem("password", data.password);
					window.localStorage.setItem("client_ID", data.client_ID);
					window.localStorage.setItem("store_ID", data.store_ID);
			
					window.location.href = ('#layout');// Change to tab page defaulting to layout
					console.log("Logged in as "+data.username);
					getData();
                } else {                   
                    alert("Wrong username or password");
                }
            },
            error : function(xhr, type) {
                alert('server error occurred @ login'+xhr.status+' '+type);
				
            }
      });   
}

function getData(){
		//set user variables
		var username = window.localStorage.getItem("username");
		var client_ID = window.localStorage.getItem("client_ID");
		var store_ID = window.localStorage.getItem("store_ID");

		$("#userLabel").html(username);
		
		$.ajax({// THis bit gets the actual Data
					type : 'POST',          
					url : 'http://microenergymonitor.com/app/allData.php', // php script URL          
					data:{
						'client_ID':client_ID,
						'store_ID':store_ID
					},
					dataType   : 'text',
					success : function(response) {      
						console.log(response);
						if(response!=="FAIL"){   
							data=$.parseJSON(response);
							console.log("Data Success");
							//getOverview();
							getLayout(data);
						} else {                   
							alert("Data retrieval fail!");
							console.log("Data retrieval fail!");
						}
					},
					error : function (XMLHttpRequest, textStatus, errorThrown) {
						console.log("textStatus :"+textStatus);
						console.log("XMLHttpRequest :"+XMLHttpRequest);
						console.log("errorThrown :"+errorThrown);
						alert('server error occurred @ getData textStatus:'+textStatus+'<br/>errorThrown'+errorThrown+'XML<br/>'+XMLHttpRequest.status);
					}
			  }); 
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

