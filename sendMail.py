import smtplib,ssl
from email import encoders
from email.mime.base import MIMEBase
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import sys

def replaceInHTML(ok,status,reason):
    return """\
    <html lang="en">
        <head>
            <style>
                table{
                    font-size: 20px;
                }
                th{
                    background-color: #d4dd56;
                    padding: 0;
                    width: 200px;
                    margin: 0;
                }
                th,td{
                    text-align: center;
                    margin: 1px 20px;
                    border: 2px solid black;
                }
            </style>
        </head>
        <body>
            <table>
                <tr>
                    <th >Ok</th>
                    <th>Status Code</th>
                    <th>Reason</th>
                </tr>
                <tr>
                    <td>"""+str(ok)+"""</td>
                    <td>"""+str(status)+"""</td>
                    <td>"""+str(reason)+"""</td>
                </tr>
            </table>
        </body>
    </html>
    """

currentDate = str(datetime.now().date())+'T'+str(datetime.now().time())[:8]


if not sys.argv[1]:
    html = """<h2>There was an exceptional error, please look into the issue(it might be a server issue, or a connexion problem).</h2>"""
else:
    html = replaceInHTML(str(sys.argv[2]),str(sys.argv[3]),str(sys.argv[4]))
context = ssl.create_default_context()
message = MIMEMultipart("alternative")
message["Subject"] = "Berth Plan dailyreport "+currentDate
message["From"] = 'no-reply@tangeralliance.com'
message["To"] = 'fayssal.ourezzouq@tangeralliance.com'

message.attach(MIMEText(html, "html"))

    

with open("./berthplan.xml", "rb") as attachment:
# Add file as application/octet-stream
# Email client can usually download this automatically as attachment
    part = MIMEBase("application", "octet-stream")
    part.set_payload(attachment.read())

# Encode file in ASCII characters to send by email    
encoders.encode_base64(part)

# Add header as key/value pair to attachment part
part.add_header(
    "Content-Disposition",
    f"attachment; filename=./berthplan.xml",
)

# Add attachment to message and convert message to string
message.attach(part)

with smtplib.SMTP("smtp.office365.com", 587,timeout=120) as server:
    server.ehlo()  # Can be omitted
    server.starttls(context=context)
    server.ehlo()  # Can be omitted
    server.login('no-reply@tangeralliance.com', "TA@nn111gier2020")
    server.sendmail('no-reply@tangeralliance.com', 'fayssal.ourezzouq@tangeralliance.com', message.as_string())
print("dddd")
sys.stdout.flush()
