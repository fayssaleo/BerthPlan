var axios = require("axios");
var axios2 = require("axios");
var fs = require("fs");
var moment = require("moment");
const spawn = require("child_process").spawn;
axios.defaults.headers.common["x-api-key"] = "WXHFMD6L4DEJ5X8LF9QM";
axios.defaults.headers.common["Accept"] = "application/json";
axios2.defaults.headers.common["Content-Type"] = "text/xml";
const startDate = new Date().toISOString().split(".")[0] + "Z";
const endDate =
  moment(new Date()).add(14, "days").toDate().toISOString().split(".")[0] + "Z";
const BASE_URL =
  "https://mistral.api.portchain.com/v1/terminals/7c903c2e-649b-4fc1-5458-2a95931f7359/port-calls?from=" +
  startDate +
  "&to=" +
  endDate +
  "&expand=allocatedCranes,plannedCraneIntensity";
function sendMail(section, ok, data, reason) {
  spawn("python", ["./sendMail.py", section, ok, data, reason]);
}
sendToTMSAAPI = (xmlFile) => {
  return new Promise((resolve, reject) => {
    axios
      .post("http://81.192.135.21:27443/importBerthPlan", xmlFile, {
        auth: {
          username: "tc3-alliance",
          password: "tc3-alliance",
        },
      })
      .then((response) => {
        //console.log(response.data.data);

        resolve(response);
      })
      .catch((error) => {
        sendMail(true, "", "", "Error in TMSA API");

        reject(error);
      });
  });
};
runPortChainAPI = () => {
  return new Promise((resolve, reject) => {
    axios
      .get(BASE_URL)
      .then((response) => {
        //console.log(response.data.data);
        fillAllBerthsPlan(response.data.data);

        resolve(response);
      })
      .catch((error) => {
        sendMail(
          true,
          error.response.statusText,
          error.response.status,
          error.response.data.errors[0].message
        );

        reject(error);
      });
  });
};
runPortChainAPI();
fillAllBerthsPlan = (berthsPlan) => {
  var tab = "\t";
  var xmlFile = "<DemandeInitiale>\n";
  xmlFile += tab + "<header>\n";
  xmlFile += tab + tab + "<msgVersion>3.0</msgVersion>\n";
  xmlFile +=
    tab +
    tab +
    "<GenerationTime>" +
    new Date().toISOString().split(".")[0] +
    "Z" +
    "</GenerationTime>\n";
  xmlFile += tab + tab + "<sender>TANGER_ALLIANCE</sender>\n";
  xmlFile += tab + "</header>\n";
  xmlFile += tab + "<body>\n";
  xmlFile += tab + tab + "<startDate>" + startDate + "</startDate>\n";
  xmlFile += tab + tab + "<endDate>" + endDate + "</endDate>\n";
  berthsPlan.map((e) => {
    xmlFile += fillOneBerthPlan(e);
  });
  xmlFile += tab + "</body>\n";
  xmlFile += "</DemandeInitiale>\n";
  fs.writeFile("berthplan.xml", xmlFile, function (err) {
    if (err) throw err;
    console.log("File is created successfully.");
  });
  //sendToTMSAAPI(xmlFile);
};
fillOneBerthPlan = (berthPlan) => {
  var tab = "\t";
  var forwardDraught = null;
  var afterDraught = null;
  var arrivalDisplacement = null;
  var departureDisplacement = null;
  var bridgeMark = null;
  var airDraft = null;
  var MarineAgent = null;
  berthPlan.customFieldValues.map((e) => {
    if (e.name == "Forward draft") {
      forwardDraught = e.value;
    } else if (e.name == "After draft") {
      afterDraught = e.value;
    } else if (e.name == "Max displacement") {
      arrivalDisplacement = e.value;
      departureDisplacement = e.value;
    } else if (e.name == "BM") {
      bridgeMark = e.value;
    } else if (e.name == "Air draft") {
      airDraft = e.value;
    } else if (e.name == "Customer note") {
      MarineAgent = e.value;
    }
  });
  var xmlFile = tab + tab + "<berths>\n";
  xmlFile += tab + tab + tab + "<berthinformation>\n";
  xmlFile +=
    tab + tab + tab + tab + "<berthPurpose>DischargeLoad</berthPurpose>\n";
  xmlFile +=
    tab + tab + tab + tab + "<requestStatus>Reservation</requestStatus>\n";
  var voy_no = "";
  if (berthPlan.inboundVoyageNumber != berthPlan.outboundVoyageNumber) {
    if (
      berthPlan.inboundVoyageNumber != null &&
      berthPlan.inboundVoyageNumber != ""
    ) {
      voy_no = berthPlan.inboundVoyageNumber;
      if (
        berthPlan.outboundVoyageNumber != null &&
        berthPlan.outboundVoyageNumber != ""
      ) {
        voy_no += "-" + berthPlan.outboundVoyageNumber;
      }
    } else {
      voy_no = berthPlan.outboundVoyageNumber;
    }
  } else {
    voy_no = berthPlan.outboundVoyageNumber;
  }
  xmlFile +=
    tab + tab + tab + tab + "<voyageNumber>" + voy_no + "</voyageNumber>\n";
  xmlFile +=
    tab +
    tab +
    tab +
    tab +
    "<vesselName>" +
    berthPlan.vessel.name +
    "</vesselName>\n";
  xmlFile +=
    tab +
    tab +
    tab +
    tab +
    "<vesselCode>" +
    berthPlan.vessel.imo +
    "</vesselCode>\n";
  xmlFile +=
    tab + tab + tab + tab + "<IMO>" + berthPlan.vessel.imo + "</IMO>\n";
  xmlFile += tab + tab + tab + tab + "<vesselType>Container</vesselType>\n";
  xmlFile +=
    tab + tab + tab + tab + "<LOA>" + berthPlan.vessel.loaMeters + "</LOA>\n";
  xmlFile += tab + tab + tab + tab + "<width>0</width>\n";
  xmlFile +=
    tab +
    tab +
    tab +
    tab +
    "<afterMetricPoint>" +
    berthPlan.positionStartMeters +
    "</afterMetricPoint>\n";
  xmlFile +=
    tab +
    tab +
    tab +
    tab +
    "<forwardMetricPoint>" +
    berthPlan.positionEndMeters +
    "</forwardMetricPoint>\n";
  xmlFile +=
    tab +
    tab +
    tab +
    tab +
    "<ETB>" +
    berthPlan.timestamps.rtaBerth +
    "</ETB>\n";
  xmlFile +=
    tab +
    tab +
    tab +
    tab +
    "<ETD>" +
    berthPlan.timestamps.rtdBerth +
    "</ETD>\n";
  xmlFile +=
    tab +
    tab +
    tab +
    tab +
    "<ETC>" +
    berthPlan.timestamps.etsCargoOps +
    "</ETC>\n";
  xmlFile +=
    tab +
    tab +
    tab +
    tab +
    "<ATC>" +
    berthPlan.timestamps.etsCargoOps +
    "</ATC>\n";
  if (forwardDraught)
    xmlFile +=
      tab +
      tab +
      tab +
      tab +
      "<forwardDraught>" +
      forwardDraught +
      "</forwardDraught>\n";
  else xmlFile += tab + tab + tab + tab + "<forwardDraught></forwardDraught>\n";
  if (afterDraught)
    xmlFile +=
      tab +
      tab +
      tab +
      tab +
      "<afterDraught>" +
      afterDraught +
      "</afterDraught>\n";
  else xmlFile += tab + tab + tab + tab + "<afterDraught></afterDraught>\n";
  if (arrivalDisplacement)
    xmlFile +=
      tab +
      tab +
      tab +
      tab +
      "<arrivalDisplacement>" +
      arrivalDisplacement +
      "</arrivalDisplacement>\n";
  else
    xmlFile +=
      tab + tab + tab + tab + "<arrivalDisplacement></arrivalDisplacement>\n";
  if (arrivalDisplacement)
    xmlFile +=
      tab +
      tab +
      tab +
      tab +
      "<departureDisplacement>" +
      arrivalDisplacement +
      "</departureDisplacement>\n";
  else
    xmlFile +=
      tab +
      tab +
      tab +
      tab +
      "<departureDisplacement></departureDisplacement>\n";
  xmlFile += tab + tab + tab + tab + "<dockName></dockName>\n";
  xmlFile +=
    tab + tab + tab + tab + "<EMP>" + berthPlan.operator.name + "</EMP>\n";

  if (bridgeMark)
    xmlFile +=
      tab + tab + tab + tab + "<bridgeMark>" + bridgeMark + "</bridgeMark>\n";
  else xmlFile += tab + tab + tab + tab + "<bridgeMark></bridgeMark>\n";
  if (airDraft)
    xmlFile +=
      tab + tab + tab + tab + "<airDraft>" + airDraft + "</airDraft>\n";
  else xmlFile += tab + tab + tab + tab + "<airDraft></airDraft>\n";
  xmlFile += tab + tab + tab + tab + "<bowBollard></bowBollard>\n";
  xmlFile += tab + tab + tab + tab + "<aftBollard></aftBollard>\n";
  xmlFile +=
    tab +
    tab +
    tab +
    tab +
    "<berthingSide>" +
    berthPlan.berthingSide +
    "</berthingSide>\n";
  if (berthPlan.service)
    xmlFile +=
      tab +
      tab +
      tab +
      tab +
      "<serviceCode>" +
      berthPlan.service.name +
      "</serviceCode>\n";
  else xmlFile += tab + tab + tab + tab + "<serviceCode></serviceCode>\n";
  if (berthPlan.service)
    xmlFile +=
      tab +
      tab +
      tab +
      tab +
      "<serviceName>" +
      berthPlan.service.name +
      "</serviceName>\n";
  else xmlFile += tab + tab + tab + tab + "<serviceName></serviceName>\n";
  xmlFile +=
    tab +
    tab +
    tab +
    tab +
    "<ETCS>" +
    berthPlan.timestamps.etsCargoOps +
    "</ETCS>\n";
  xmlFile +=
    tab +
    tab +
    tab +
    tab +
    "<ATCS>" +
    berthPlan.timestamps.etsCargoOps +
    "</ATCS>\n";
  xmlFile +=
    tab +
    tab +
    tab +
    tab +
    "<totalMoves>" +
    (parseInt(berthPlan.moves.load + "") +
      parseInt(berthPlan.moves.discharge + "") +
      parseInt(berthPlan.moves.restows + "")) +
    "</totalMoves>\n";
  xmlFile +=
    tab +
    tab +
    tab +
    tab +
    "<dischargeMoves>" +
    berthPlan.moves.discharge +
    "</dischargeMoves>\n";
  xmlFile +=
    tab +
    tab +
    tab +
    tab +
    "<loadMoves>" +
    berthPlan.moves.load +
    "</loadMoves>\n";
  xmlFile +=
    tab +
    tab +
    tab +
    tab +
    "<restowMoves>" +
    berthPlan.moves.restows +
    "</restowMoves>\n";
  xmlFile +=
    tab + tab + tab + tab + "<pmph>" + berthPlan.plannedGmph + "</pmph>\n";
  xmlFile +=
    tab +
    tab +
    tab +
    tab +
    "<numberOfCranesAvg>" +
    berthPlan.plannedCraneIntensity +
    "</numberOfCranesAvg>\n";
  if (MarineAgent)
    xmlFile +=
      tab +
      tab +
      tab +
      tab +
      "<MarineAgent>" +
      MarineAgent +
      "</MarineAgent>\n";
  else xmlFile += tab + tab + tab + tab + "<MarineAgent></MarineAgent>\n";
  xmlFile +=
    tab + tab + tab + tab + "<terminalRvDeparture></terminalRvDeparture>\n";
  xmlFile += tab + tab + tab + tab + "<securite>\n";
  xmlFile +=
    tab + tab + tab + tab + tab + "<siCertificatISPS>0</siCertificatISPS>\n";
  xmlFile +=
    tab +
    tab +
    tab +
    tab +
    tab +
    "<referenceCertificatISPS>0</referenceCertificatISPS>\n";
  xmlFile += tab + tab + tab + tab + "</securite>\n";
  xmlFile += tab + tab + tab + "</berthinformation>\n";
  xmlFile += tab + tab + "</berths>\n";
  return xmlFile;
};
