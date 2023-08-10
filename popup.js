let findPCR  = document.getElementById("findPCR");
let bodies = document.getElementById("body");
let upb = 0;
let lwb = 0;
findPCR.addEventListener("click",async ()=>{
//    Get current active tab
    upb = document.getElementById("ub").value;
    lwb = document.getElementById("lb").value;
    let [tab] = await chrome.tabs.query({active:
    true, currentWindow: true});
    // Execute script to parse emails on page
    chrome.scripting.executeScript({
    target: {tabId: tab.id},
    function:calculatePCR,
    args:[upb,lwb]
    });
})
// Handler to receive values from NSE website
chrome.runtime.onMessage.addListener((request,sender,sendResponse)=>{
    let Niftyval = request.Niftyval;
    let change = request.change;
    let percentchange = request.percentchange;
    let ratio = request.ratio;
    let truerange = request.truerange;
    let date = request.date;
    if(Niftyval !=null && percentchange!=null && date!=null){
    document.getElementById("index").innerText = Niftyval;
    document.getElementById("chg").innerText = percentchange;
    document.getElementById("date").innerHTML = date;
        if(parseFloat(percentchange)<0){
            document.getElementById("index").style="color:#FF0000;";
            document.getElementById("chg").style="color:#FF0000;";
        }
        else{
            document.getElementById("index").style ="color:#43DD29;";
            document.getElementById("chg").style ="color:#43DD29;";
        }
    }
    else{
        let tpcrv = document.getElementById("tpcrv");
        let fpcrv = document.getElementById("fpcrv");
        let res = document.getElementById("result");
        let speed = Math.round((ratio*90));
        speed = speed>180? 180:speed;
        document.querySelector(".arrow").style.transform = "rotate("+speed+"deg)";
        // alert(ratio+" "+truerange);
        fpcrv.innerText = truerange;
        tpcrv.innerText = ratio;
        document.getElementById("underlyingindex").innerText = request.index;
        let result = "Neutral"
        res.style = "color:#cfcc21"
        if(ratio<=0.90 &&ratio>=0.75){
            result = "Slightly Bullish"
            res.style = "color:#90EF80"
        }
        else if(ratio<0.75){
            result = "Extremely Bullish"
            res.style ="color:#43DD29;"
        }
        else if (ratio>1.25&&ratio <=1.5 ){
            result = "Slightly Bearish"
            res.style = "color:#F85A5A"
        }
        else if(ratio>1.5){
            result = "Exteremly bearish"
            res.style = "color:#FF0000"
        }
        res.innerHTML = result;
    }
})
// Function to scrape emails
function calculatePCR(upb,lwb){
    let flag1 =false;
    let flag2 = false;
    let PEOI=0;
    let CEOI=0;
    let PE=0;
    let CE = 0;
    // RegEx to parse emails from html code
    try{
        if(parseInt(upb)<parseInt(lwb))
            alert("Upper Bound must be higher than the Lower Bound")
        else{
            upb = upb.slice(0,2)+","+upb.slice(2,5)+".00";
            lwb = lwb.slice(0,2)+","+lwb.slice(2,5)+".00";
            var t = document.getElementById('optionChainTable-indices');
            var total = document.getElementById('equityOptionChainTotalRow')
            if(t) {
            Array.from(t.rows).forEach((tr, row_ind) => {
                if(row_ind>=2){
                    
                    if(tr.cells[row_ind,11].textContent==lwb){
                        flag1=true;
                    }
                    if(flag1==true&&flag2==false)
                    {
                        letOI=0;
                        if(tr.cells[row_ind,1].textContent == "-")
                            OI=0;
                        else{
                            OI = parseInt(tr.cells[row_ind,1].textContent.replace(",",""));
                            CEOI = CEOI+OI;
                        }   
                        if(tr.cells[row_ind,21].textContent == "-")
                            OI = 0;
                        else{
                            OI = parseInt(tr.cells[row_ind,21].textContent.replace(",",""));
                            PEOI = PEOI+OI;
                        }
                    }
                    if(tr.cells[row_ind,11].textContent==upb){
                        flag2=true;
                    }
                }
            });
            if(flag1==false || flag2==false){
                alert("Bounds Out of Range");
                throw new Error("Exit Loop");
            }
            else{
                let ratio = Math.trunc((PEOI/CEOI)*1000)/1000;;
                Array.from(total.rows).forEach((tr, row_ind) =>{
                    CE = parseInt(tr.cells[row_ind,1].textContent.replace(",",""));
                    PE = parseInt(tr.cells[row_ind,21].textContent.replace(",",""));
                });
                let underlyingindex = document.getElementById("equity_underlyingVal").innerHTML;
                let pos = underlyingindex.search(/NIFTY/);
                let index = underlyingindex.substring(0,pos+5);
                let truerange =Math.trunc((PE/CE)*1000)/1000;
                // alert(Math.trunc(truerange*1000)/1000+" "+ratio)
                chrome.runtime.sendMessage({ratio,truerange,index});
            }
            }
        }
    }
    catch(error)
    {}
}
window.addEventListener("load", async()=> {
        let [tab] = await chrome.tabs.query({active:
        true, currentWindow: true});
        chrome.scripting.executeScript({
        target: {tabId: tab.id},
        function:updateval,
        args:[1,2]
    });
});
function updateval(a,b){
    let Niftyval = parseFloat(document.getElementsByClassName("index_val")[0].textContent.replace(",",""));
    let percentchange;
    try{
        try{
            let change = parseFloat(document.getElementsByClassName("per redTxt")[0].children[0].innerHTML.replace(",",""));
            percentchange =change+"  ("+parseFloat(document.getElementsByClassName("per redTxt")[0].children[1].innerHTML)+")%";
        }
        catch(error){
            percentchange = document.getElementsByClassName("per redTxt")[0].innerHTML;
        }
    }
    catch(error){
        try{
            percentchange = document.getElementsByClassName("per greenTxt")[0].innerHTML.replace(",","");
        }
        catch(error){
            let change = parseFloat(document.getElementsByClassName("per greenTxt")[0].children[0].innerHTML.replace(",",""));
            percentchange =change+"  ("+parseFloat(document.getElementsByClassName("per greenTxt")[0].children[1].innerHTML)+")%";
        }
    }
    // let percentchange =change+"  ("+parseFloat(document.getElementsByClassName("per greenTxt")[0].children[1].innerHTML)+")%";
    let date = document.getElementsByClassName("nifty50-tradedate")[0].innerHTML;
    chrome.runtime.sendMessage({Niftyval,percentchange,date});
}