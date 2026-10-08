from sqlalchemy import select, text
from sqlalchemy.orm import Session

from .database import Base, SessionLocal, engine
from .exam_bank import MCQ_BANK
from .models import Lesson, Module, Quiz, QuizOption, QuizQuestion, Unit


ASSESSMENT_MODULE_TITLE = "topic assessments"
LEGACY_MODULE_TITLES = {"linux basics", "unit 1 case study", "assessment practice"}
EXAM_BANK_MODULE_TITLE = "exam bank"


def exam_bank_module(unit_order_index: int) -> dict:
    """hidden module holding the ap exam bank questions for one unit."""
    unit_pool = [q for q in MCQ_BANK if q["unit"] == unit_order_index]
    return {
        "title": EXAM_BANK_MODULE_TITLE,
        "description": "internal ap exam bank questions. hidden from student course pages.",
        "order_index": 99,
        "is_hidden": True,
        "lessons": [
            {
                "title": f"exam bank set {unit_order_index}",
                "lesson_type": "reading",
                "order_index": 1,
                "video_url": None,
                "content": "internal exam bank storage. not part of the student course.",
                "quiz": {
                    "title": f"exam bank {unit_order_index}",
                    "description": "internal exam bank storage.",
                    "questions": [
                        {
                            "question_text": q["question_text"],
                            "order_index": q_index,
                            "options": [
                                {"option_text": q["correct"], "is_correct": True},
                                {"option_text": q["wrong"][0], "is_correct": False},
                                {"option_text": q["wrong"][1], "is_correct": False},
                                {"option_text": q["wrong"][2], "is_correct": False},
                            ],
                        }
                        for q_index, q in enumerate(unit_pool, start=1)
                    ],
                },
            }
        ],
    }


AP_MODULES = [
    {
        "title": "introduction to security",
        "description": "assessment practice for social engineering, suspicious logins, public networks, AI-enabled attacks, and AI-assisted defense.",
        "order_index": 1,
        "topics": [
            {
                "code": "1.1",
                "title": "understanding social engineering",
                "scenario": "a teacher receives an urgent document-sharing email from a look-alike sender while a student is waiting for help.",
                "evidence": "sender: do-not-reply@g00gle.com\nsubject: [urgent] access requested\nmessage: click now or your student will not be able to finish the assignment.",
                "risk": "urgency and authority pressure can push the target to click before checking the sender and link destination.",
                "questions": [
                    {
                        "text": "a message shows the sender name 'riverside it support' but the address is support-team@riverside-verify.example, and it gives recipients two hours to act. which detail most clearly marks this as a social engineering attempt?",
                        "options": [
                            "the look-alike sender domain paired with an artificial deadline",
                            "the message was sent to more than one recipient at the same time",
                            "the message asks the recipient to sign in to an account they already hold",
                            "the sender included a signature block with a phone number",
                        ],
                        "answer": 0,
                    },
                    {
                        "text": "a message displayed as the principal asks a secretary to buy gift cards and to keep the request secret until the staff event. what makes this request dangerous even though the sender name looks correct?",
                        "options": [
                            "gift cards lose their audit trail as soon as they are redeemed",
                            "the district mail filter skips messages that display an internal sender name",
                            "forged sender details pass visual checks, and secrecy removes the people who would question the request",
                            "the principal is only allowed to approve purchases under a fixed budget limit",
                        ],
                        "answer": 2,
                    },
                    {
                        "text": "a colleague receives an attachment named staff_bonuses.xlsx and is told not to open it 'until payroll finalizes.' how does the secrecy instruction increase risk?",
                        "options": [
                            "the mail gateway skips attachments whose names look like office documents",
                            "it delays the analysis that would reveal a malicious attachment before anyone runs it",
                            "payroll figures must be encrypted before they can be sent by email",
                            "the file expires before the recipient's antivirus can update its definitions",
                        ],
                        "answer": 1,
                    },
                    {
                        "text": "which verification step most reliably confirms that an unusual request is genuine?",
                        "options": [
                            "reply on the same thread and compare the writing style to earlier messages",
                            "check that the message shows the correct logo and signature block",
                            "confirm the message passed the district spam filter",
                            "verify on a channel agreed before this exchange",
                        ],
                        "answer": 3,
                    },
                ],
                "pset": "explain two details you would cite to convince the teacher not to click the link, then recommend one safer verification step.",
            },
            {
                "code": "1.2",
                "title": "suspicious website logins",
                "scenario": "a student lands on a school login page from an email link. the page looks familiar, but the URL is portal-baisedu-login.example.net.",
                "evidence": "url: portal-baisedu-login.example.net\npage: school logo, username field, password field, no MFA prompt\ncertificate: valid for example.net",
                "risk": "a convincing fake login page can collect credentials even when it has a valid certificate for the wrong domain.",
                "questions": [
                    {
                        "text": "the fake login page at portal-baisedu-login.example.net presents a valid certificate issued for example.net. what does the valid certificate actually prove?",
                        "options": [
                            "the connection to whoever controls example.net is encrypted in transit",
                            "the page is operated by the school's identity provider",
                            "the domain passed a background check by the certificate authority",
                            "the password will be stored securely by the site",
                        ],
                        "answer": 0,
                    },
                    {
                        "text": "a student reaches a school-looking login page from an email link and there is no MFA prompt. what is the safest action before entering credentials?",
                        "options": [
                            "type the password but leave the MFA field empty until the site asks",
                            "navigate to the known school portal directly and compare the domain",
                            "reuse the login link after waiting for the mail filter to re-scan it",
                            "submit the credentials because the certificate is valid",
                        ],
                        "answer": 1,
                    },
                    {
                        "text": "after a student submits a password on the fake page, the real portal still rejects the login. which explanation best fits the evidence?",
                        "options": [
                            "the adversary captured the password but could not defeat the real MFA challenge",
                            "the school password policy expired the password at midnight",
                            "the fake page stored the password but the portal only accepts MFA codes",
                            "the certificate mismatch caused the portal to reject the session",
                        ],
                        "answer": 0,
                    },
                    {
                        "text": "which change would most reduce the damage from a stolen school password today?",
                        "options": [
                            "phishing-resistant MFA tied to a device the adversary never receives",
                            "a longer password history that blocks reuse of the last twelve passwords",
                            "a certificate transparency log for the school domain",
                            "disabling the lock screen on shared lab computers",
                        ],
                        "answer": 0,
                    },
                ],
                "pset": "identify the suspicious login indicators and describe how MFA changes the risk if the password is stolen.",
            },
            {
                "code": "1.3",
                "title": "best practices for public networks",
                "scenario": "at a cafe, a student sees two networks: coffeehouse and coffeehouse-free. the second has stronger signal and no password.",
                "evidence": "network list: coffeehouse WPA2, coffeehouse-free open\nactivity planned: checking school email and downloading assignment files",
                "risk": "an evil twin access point can trick users into joining a network controlled by an adversary.",
                "questions": [
                    {
                        "text": "coffeehouse-free is an open network that clones the name of the paid coffeehouse network. which observation would most confirm the evil twin before a student joins it?",
                        "options": [
                            "the access point advertises a stronger signal than the paid network",
                            "the captive portal asks for a credit card to activate free wi-fi",
                            "two access points answer for the same network name with different gateway addresses",
                            "the network appears first in the operating system's saved networks list",
                        ],
                        "answer": 2,
                    },
                    {
                        "text": "a student must submit an assignment over the cafe's open wi-fi. which combination best limits the risk?",
                        "options": [
                            "turn off https warnings so the pages load faster",
                            "use the school VPN and keep the session on the school portal tab only",
                            "share the network password with classmates so they can also submit",
                            "join the strongest signal so the transfer finishes quickly",
                        ],
                        "answer": 1,
                    },
                    {
                        "text": "a VPN connection to the school drops, and the laptop silently falls back to the open cafe network mid-download. what risk does this create?",
                        "options": [
                            "the download continues unencrypted on a network the student does not control",
                            "the VPN provider can now read the school credentials a second time",
                            "the cafe router can revoke the school certificate",
                            "the laptop's saved passwords are automatically exported",
                        ],
                        "answer": 0,
                    },
                    {
                        "text": "a classmate argues that HTTPS means an open network is safe. what is the strongest rebuttal?",
                        "options": [
                            "HTTPS hides the response body but leaves the destination hostnames visible to the access point",
                            "HTTPS only works on networks that require a password",
                            "HTTPS certificates are only issued to school domains",
                            "HTTPS disables the operating system firewall during the session",
                        ],
                        "answer": 0,
                    },
                ],
                "pset": "compare the risks of joining each network and explain whether a VPN fully removes the need to trust the VPN provider.",
            },
            {
                "code": "1.4",
                "title": "AI-based cybersecurity attacks",
                "scenario": "a finance assistant receives a voice message that sounds like the principal asking for emergency gift card purchases.",
                "evidence": "voice message: urgent tone, asks for secrecy, requests gift cards\ncontext: public videos of the principal are online",
                "risk": "generative AI can imitate voices and produce convincing social engineering messages.",
                "questions": [
                    {
                        "text": "a cloned voice message asks the finance assistant to buy gift cards immediately and keep it quiet; public videos of the principal exist online. which detail most explains why the clone is convincing?",
                        "options": [
                            "voice messages bypass the district mail filter entirely",
                            "a few minutes of public audio is enough to imitate cadence and vocabulary",
                            "gift card requests are always approved by the business office",
                            "the assistant has never spoken to the principal in person",
                        ],
                        "answer": 1,
                    },
                    {
                        "text": "the assistant calls the principal's listed number and reaches voicemail. which next step best defeats the attack?",
                        "options": [
                            "leave a voicemail asking whether the gift card request was real",
                            "text the number that appeared in the original voice message",
                            "wait for the principal to reply on the same messaging app",
                            "purchase one small gift card to test whether the request is legitimate",
                        ],
                        "answer": 0,
                    },
                    {
                        "text": "what most increases the risk of an AI-cloned voice request succeeding in a school?",
                        "options": [
                            "staff can be reached directly without a shared verification procedure for urgent money requests",
                            "the district records board meetings and posts them publicly",
                            "voicemail systems compress audio before playback",
                            "gift cards can be purchased at retail locations",
                        ],
                        "answer": 0,
                    },
                    {
                        "text": "which control would best limit the damage when an AI-cloned voice demand arrives?",
                        "options": [
                            "a callback rule that verifies payment requests through a second channel every time",
                            "a rule that blocks all calls after 5 pm",
                            "removing the principal's name from the district website",
                            "requiring gift card purchases to use cash instead of a district card",
                        ],
                        "answer": 0,
                    },
                ],
                "pset": "describe a verification workflow the assistant should follow before acting on the request.",
            },
            {
                "code": "1.5",
                "title": "leveraging AI in cyber defense",
                "scenario": "a school receives thousands of login events per day. the IT team wants help identifying unusual failed-login patterns.",
                "evidence": "baseline: 2-3 failed logins per user per week\nalert: 48 failed logins for one user from three countries in 12 minutes",
                "risk": "large log volumes can hide attacks unless detection tools surface unusual patterns.",
                "questions": [
                    {
                        "text": "a model trained on last year's login data now flags every new teacher's first-week failed logins as attacks. what best explains the false positives?",
                        "options": [
                            "the training data never contained first-week account setup behavior",
                            "the model was trained on too many legitimate events",
                            "failed logins are not stored long enough for the model",
                            "the baseline used a median instead of a mean",
                        ],
                        "answer": 0,
                    },
                    {
                        "text": "the alert volume is high and the team can investigate twenty cases per day. which approach best reduces risk with the same staffing?",
                        "options": [
                            "let the model auto-close every low-confidence alert to save analyst time",
                            "rank alerts by risk score and start with the top of the queue",
                            "sample twenty alerts at random each day",
                            "raise the failed-login threshold to one hundred per account",
                        ],
                        "answer": 1,
                    },
                    {
                        "text": "an analyst notices the model flags logins from new countries but never flags credential stuffing that stays inside one country. what does this indicate?",
                        "options": [
                            "the model learned one correlate of attacks instead of the full range of attack behavior",
                            "the model is overfitting to country labels in the training set",
                            "the log pipeline is dropping authentication events",
                            "the scoring threshold was set below the historic baseline",
                        ],
                        "answer": 0,
                    },
                    {
                        "text": "which practice keeps AI-assisted triage defensible when a student disputes a locked account?",
                        "options": [
                            "record the model version, input features, and human decision for every action taken",
                            "delete the alert once the account is unlocked",
                            "let the model explain its decision in plain language after the fact",
                            "require two models to agree before locking any account",
                        ],
                        "answer": 0,
                    },
                ],
                "pset": "explain one benefit and one risk of using AI to triage login alerts.",
            },
        ],
    },
    {
        "title": "securing spaces",
        "description": "assessment practice for physical vulnerabilities, physical controls, and detecting physical attacks.",
        "order_index": 2,
        "topics": [
            {
                "code": "2.1",
                "title": "cyber foundations",
                "scenario": "a school is mapping assets before improving security for a small server closet and shared front-desk computer.",
                "evidence": "assets: server, badge reader, front-desk workstation, printed visitor logs\nconcerns: unauthorized access, theft, downtime",
                "risk": "security work starts by identifying assets, threats, vulnerabilities, likelihood, and impact.",
                "questions": [
                    {
                        "text": "a teammate argues that the printed visitor logs cannot be assets because they are just paper. which statement best settles the disagreement?",
                        "options": [
                            "the logs are an asset because losing them impairs the school's ability to reconstruct who was in the building",
                            "the teammate is right because only networked devices count as assets",
                            "the logs are a threat because visitors write in them",
                            "the logs are a vulnerability because paper can burn",
                        ],
                        "answer": 0,
                    },
                    {
                        "text": "a risk register row lists a tailgating incident and an unlocked delivery entrance in the same cell. which pairing correctly separates threat from vulnerability?",
                        "options": [
                            "threat: the delivery entrance is unlocked during morning rush; vulnerability: a person entering behind an employee",
                            "threat: an unauthorized person entering the building; vulnerability: the entrance left unlocked so they can",
                            "threat: the server closet; vulnerability: the camera above it",
                            "threat: the door lock; vulnerability: the visitor log",
                        ],
                        "answer": 1,
                    },
                    {
                        "text": "two risks are rated: a server closet fire is rare but would close the front desk for days, while an unattended screen happens weekly but costs little. how should the team respond?",
                        "options": [
                            "spend the entire budget on fire suppression because its impact is highest",
                            "ignore both because neither is certain to happen",
                            "treat both proportionately: a cheap immediate fix for the frequent issue and a phased plan for the rare high-impact one",
                            "rate likelihood and impact as the same measurement and average them",
                        ],
                        "answer": 2,
                    },
                    {
                        "text": "which statement about impact is most accurate for the front-desk workstation?",
                        "options": [
                            "impact only counts the replacement price of the hardware",
                            "impact cannot be estimated before an incident happens",
                            "impact applies to threats but not to assets",
                            "impact covers lost records, privacy exposure, and disrupted check-in, not just hardware",
                        ],
                        "answer": 3,
                    },
                ],
                "pset": "classify two assets, two threats, and two vulnerabilities from the evidence.",
            },
            {
                "code": "2.2",
                "title": "physical vulnerabilities and attacks",
                "scenario": "a visitor follows an employee through a locked side door while carrying a box and saying their badge is in their car.",
                "evidence": "door log: one badge scan, two people entered\ncamera note: second person carried box, no visitor badge visible",
                "risk": "tailgating and piggybacking can bypass technical access controls.",
                "questions": [
                    {
                        "text": "the badge log shows one scan but the camera shows two people entering. which inference is best supported by both records?",
                        "options": [
                            "the second person's badge failed, so they must be authorized",
                            "the second person entered without their own badge scan, which matches tailgating",
                            "the camera and the log disagree, so neither can be trusted",
                            "the door was propped open by facilities staff",
                        ],
                        "answer": 1,
                    },
                    {
                        "text": "a visitor says 'my badge is in my car' while following an employee through the door. why does this line work so well as social engineering?",
                        "options": [
                            "it creates a polite moment where holding the door feels helpful and checking feels rude",
                            "badge readers cannot read through cardboard boxes",
                            "doors unlock automatically when someone mentions a car",
                            "employees are trained to never question a person carrying a box",
                        ],
                        "answer": 0,
                    },
                    {
                        "text": "which control most directly reduces tailgating without slowing legitimate traffic?",
                        "options": [
                            "removing the side doors entirely",
                            "a stronger password policy on the front-desk workstations",
                            "an anti-tailgate interlock that admits one badge holder at a time",
                            "encrypting the visitor log",
                        ],
                        "answer": 2,
                    },
                    {
                        "text": "which observation in camera footage best distinguishes piggybacking from tailgating?",
                        "options": [
                            "the clothing color of the second person",
                            "whether the intruder carried anything",
                            "the time of day the door was used",
                            "whether the intruder was waved in by an employee versus entering uninvited behind someone",
                        ],
                        "answer": 3,
                    },
                ],
                "pset": "explain the difference between tailgating and piggybacking using this scenario.",
            },
            {
                "code": "2.3",
                "title": "protecting physical spaces",
                "scenario": "a server room has a lock, but the hallway is unmonitored and employees often hold the door open.",
                "evidence": "controls: door lock only\nobservations: no camera, no visitor sign-in, no held-door alarm",
                "risk": "one control is weaker than layered physical security controls.",
                "questions": [
                    {
                        "text": "the server room has a lock, but the hallway is unmonitored and employees hold the door open. why does the single lock underperform?",
                        "options": [
                            "server room locks are decorative and never enforced",
                            "a control only holds if the process around it holds; held doors defeat the lock in practice",
                            "locks are obsolete compared to cameras",
                            "the lock weakens the door frame over time",
                        ],
                        "answer": 1,
                    },
                    {
                        "text": "which set correctly matches each control to the risk it reduces?",
                        "options": [
                            "camera \u2192 door propped open; sign-in \u2192 after-the-fact review; alarm \u2192 unknown people present",
                            "fire suppression \u2192 tailgating; sign-in \u2192 power loss; alarm \u2192 weak passwords",
                            "stronger lock \u2192 unmonitored hallway; camera \u2192 unknown visitors; sign-in \u2192 power outages",
                            "held-door alarm \u2192 door propped open; visitor sign-in \u2192 unknown people in the space; camera \u2192 after-the-fact review",
                        ],
                        "answer": 3,
                    },
                    {
                        "text": "the school adds a camera but keeps allowing the door to be propped open. what best predicts the outcome?",
                        "options": [
                            "the camera alone will stop the behavior it records",
                            "the camera disables the lock's sensor",
                            "footage will document incidents the alarm-and-training layer would have prevented",
                            "nothing changes because cameras need no placement planning",
                        ],
                        "answer": 2,
                    },
                    {
                        "text": "why does a visitor sign-in sheet add protection even when a camera already exists?",
                        "options": [
                            "it creates an identity record for who was authorized to be present at a given time",
                            "it replaces the need for badges",
                            "sign-in sheets cannot be forged",
                            "it encrypts the hallway access list",
                        ],
                        "answer": 0,
                    },
                ],
                "pset": "recommend three layered controls and match each control to the risk it reduces.",
            },
            {
                "code": "2.4",
                "title": "detecting physical attacks",
                "scenario": "after a missing laptop report, the school checks badge logs, camera footage, and workstation activity.",
                "evidence": "badge log: side door opened 9:12 PM\ncamera: person left with laptop bag\nworkstation: login failed at 9:18 PM",
                "risk": "physical attacks can be detected by correlating access logs, camera evidence, and device activity.",
                "questions": [
                    {
                        "text": "badge log: side door opened 9:12 pm. camera: a person left with a laptop bag. workstation: login failed at 9:18 pm. which combination best establishes the sequence?",
                        "options": [
                            "the timestamped badge log and camera footage together anchor entry and exit; the failed login adds device-side timing",
                            "the laptop's serial number and the desk label",
                            "the failed login alone, because authentication logs never mislead",
                            "the number of desks in the room",
                        ],
                        "answer": 0,
                    },
                    {
                        "text": "the failed workstation login at 9:18 pm most suggests what?",
                        "options": [
                            "the operating system updated itself during the incident",
                            "someone attempted to use the device after it left the building without the correct credential",
                            "the badge reader double-scanned the employee",
                            "the camera's timestamp drifted",
                        ],
                        "answer": 1,
                    },
                    {
                        "text": "which missing piece of evidence would most strengthen the timeline?",
                        "options": [
                            "the thermostat reading in the server closet",
                            "the cleaning crew's schedule from last month",
                            "the workstation's authentication and network logs showing which account was attempted",
                            "the laptop brand and color",
                        ],
                        "answer": 2,
                    },
                    {
                        "text": "badge and camera show one person exiting, but inventory reports two laptops missing. what does the mismatch most warrant?",
                        "options": [
                            "closing the case, because cameras are definitive",
                            "assuming the inventory count is wrong without checking",
                            "disabling all badge readers pending review",
                            "expanding the review to other exits and earlier footage, since the first exit may not cover every departure",
                        ],
                        "answer": 3,
                    },
                ],
                "pset": "write a short incident timeline and identify one missing piece of evidence you would request.",
            },
        ],
    },
    {
        "title": "securing networks",
        "description": "assessment practice for network attacks, wireless security, segmentation, firewalls, and network detection.",
        "order_index": 3,
        "topics": [
            {
                "code": "3.1",
                "title": "network vulnerabilities and attacks",
                "scenario": "families report reaching a fake school portal after typing the correct url; the help desk logs six credential-theft reports in one morning.",
                "evidence": "dns: portal.school.edu resolves to 203.0.113.55, expected 10.10.4.20\ncache: poisoned entry installed 40 minutes ago on three branch resolvers\ncertificate: valid for portal-school-edu.hosting-provider.example, not the school domain",
                "task": "trace how a correct url reached an adversary-controlled host, explain which security property is harmed before any credentials are typed, and propose one detection control and one remediation step.",
                "questions": [
                    {
                        "text": "portal.school.edu resolves to 203.0.113.55 while the school's authoritative record still lists 10.10.4.20, and three branches received the new answer within 40 minutes. what does this pattern most strongly indicate?",
                        "options": [
                            "an ordinary misconfiguration at the authoritative server",
                            "dns cache poisoning spreading through shared resolvers",
                            "a browser extension rewriting typed urls",
                            "the certificate authority issuing a bad certificate",
                        ],
                        "answer": 1,
                    },
                    {
                        "text": "users land on portal-school-edu.hosting-provider.example, which shows a valid padlock. why is the padlock not reassurance?",
                        "options": [
                            "the padlock only means the connection to that hostname is encrypted - the hostname itself is the attacker's",
                            "padlocks only appear on sites that failed inspection",
                            "the school's site would show two padlocks",
                            "certificates expire after twenty-four hours",
                        ],
                        "answer": 0,
                    },
                    {
                        "text": "which control would have stopped the poisoned entry from being trusted?",
                        "options": [
                            "longer passwords on the resolver admin console",
                            "moving the gradebook to another subnet",
                            "disabling https on the portal",
                            "dnssec validation so answers without a valid signature are rejected",
                        ],
                        "answer": 3,
                    },
                    {
                        "text": "six students entered credentials on the fake page. which response addresses the immediate harm?",
                        "options": [
                            "wait for the certificate to expire",
                            "rebuild the school's dns records from scratch",
                            "force a password reset for the affected accounts and revoke active sessions",
                            "block 10.10.4.20 at the firewall",
                        ],
                        "answer": 2,
                    },
                ],
                "frq": [
                    {
                        "points": 3,
                        "verb": "identify",
                        "text": "identify the attack shown by the evidence and name the two details that confirm it.",
                        "answer": "dns poisoning (dns spoofing). the resolver returns 203.0.113.55 instead of the authoritative 10.10.4.20, and a poisoned cache entry installed 40 minutes ago spread to three branch resolvers without any signature check.",
                        "full_credit": "names dns poisoning and cites both the wrong a record and the unverified poisoned cache entry.",
                        "rungs": [
                            "names the attack but cites only one confirming detail",
                            "describes the symptom (the redirect) without naming the attack",
                        ],
                    },
                    {
                        "points": 4,
                        "verb": "explain",
                        "text": "explain how the victim's connection stays encrypted and is still compromised.",
                        "answer": "tls terminates at the adversary's server, so the browser shows an encrypted session to whoever controls portal-school-edu.hosting-provider.example. encryption protects the channel, not the destination, and dns already chose the destination.",
                        "full_credit": "states that tls authenticates the connection to a destination that poisoned dns already redirected.",
                        "rungs": [
                            "claims https was broken or bypassed",
                            "notes the certificate is valid but never links it to dns as the redirect cause",
                        ],
                    },
                    {
                        "points": 4,
                        "verb": "describe",
                        "text": "describe one detection control and one remediation step for the district.",
                        "answer": "detection: alert when a known internal name resolves to an external address range, comparing resolver answers against a signed allowlist. remediation: flush the poisoned cache on the affected resolvers, block 203.0.113.55, and require dnssec validation on school resolvers.",
                        "full_credit": "one dns-specific detection control plus one remediation that removes or blocks the poisoned entry.",
                        "rungs": [
                            "offers only 'change passwords' or only one of the two asks",
                            "suggests a control unrelated to dns, such as a screen lock policy",
                        ],
                    },
                    {
                        "points": 3,
                        "verb": "justify",
                        "text": "justify why the valid certificate on the fake portal does not reduce the risk.",
                        "answer": "the certificate authenticates the hosting provider's domain to the browser; it never asserts the site is the school. trust in portal.school.edu comes from the dns path, which is exactly what was poisoned.",
                        "full_credit": "separates transport authentication (who owns the domain) from service identity (which domain the school owns).",
                        "rungs": [
                            "says certificates are useless without explaining their scope",
                            "correct idea with no reference to dns as the trust path",
                        ],
                    },
                ],
            },
            {
                "code": "3.2",
                "title": "protecting networks: managerial controls and wireless security",
                "scenario": "a teacher's laptop joins a network named 'school-secure' from a classroom and reaches the gradebook; the district has never issued a written wireless policy.",
                "evidence": "scan: two access points broadcast 'school-secure', one mac address absent from the asset inventory\npolicy: no written acceptable-use or wireless standard on record\ntraffic: personal and staff devices share one vlan with no client isolation",
                "task": "classify the missing control, explain why an unmanaged access point is dangerous even with strong encryption, and propose one managerial and one technical control.",
                "questions": [
                    {
                        "text": "two access points broadcast 'school-secure' but only one mac address appears in the asset inventory. which action most directly addresses the unmanaged device?",
                        "options": [
                            "locate its switch port and disable it until it is registered and reconfigured",
                            "rename the school's ssid so the rogue cannot match it",
                            "increase the wi-fi transmit power in that hallway",
                            "add the device to the password spreadsheet",
                        ],
                        "answer": 0,
                    },
                    {
                        "text": "the district has no written wireless policy. what is the first-order consequence?",
                        "options": [
                            "wireless traffic is automatically unencrypted without a policy",
                            "the rogue access point cannot be detected",
                            "staff may not use the internet",
                            "there is no authorized baseline, so violations cannot be enforced and approvals have no owner",
                        ],
                        "answer": 3,
                    },
                    {
                        "text": "the rogue access point uses wpa3. why is this still insufficient protection?",
                        "options": [
                            "wpa3 does not encrypt traffic at all",
                            "wpa3 keys are published in the beacon frame",
                            "encryption protects the link to the access point but says nothing about who operates it",
                            "wpa3 only works on wired connections",
                        ],
                        "answer": 2,
                    },
                    {
                        "text": "personal and staff devices share one vlan with no client isolation. which risk does that create?",
                        "options": [
                            "students cannot reach the internet",
                            "a compromised personal device can reach staff devices directly on the same layer-2 domain",
                            "the wireless password must be rotated daily",
                            "access points stop broadcasting the ssid",
                        ],
                        "answer": 1,
                    },
                ],
                "frq": [
                    {
                        "points": 3,
                        "verb": "identify",
                        "text": "identify the managerial control that is missing and explain why it matters before any technical fix.",
                        "answer": "a written wireless security and acceptable-use policy defining who may connect devices, who may install access points, and how exceptions are approved. without it there is no authorized baseline to enforce, no owner for approvals, and violations cannot be attributed.",
                        "full_credit": "names a written policy or approval process and ties it to baseline, accountability, or enforcement.",
                        "rungs": [
                            "names a technical control instead",
                            "says a policy is nice without stating what it governs",
                        ],
                    },
                    {
                        "points": 4,
                        "verb": "explain",
                        "text": "explain why the unmanaged access point is a risk even though traffic is encrypted.",
                        "answer": "encryption protects the link between a client and the access point it joined; it says nothing about who operates that access point. a rogue access point can present a valid handshake and then log, read, or alter every session it terminates, and serve a rogue gateway to redirect clients.",
                        "full_credit": "states that encryption authenticates the network to the client, not the operator of the access point.",
                        "rungs": [
                            "claims the encryption itself is broken",
                            "confuses encryption at rest with link encryption",
                        ],
                    },
                    {
                        "points": 3,
                        "verb": "describe",
                        "text": "describe one managerial and one technical control that together close this gap.",
                        "answer": "managerial: an approved-device and access-point policy with an inventory of authorized bssid addresses and stated consequences for unmanaged hardware. technical: wpa3-enterprise with per-user credentials plus rogue-ap detection that alerts on unknown bssid, alongside wired port security on unused ports.",
                        "full_credit": "one concrete control from each category, each specific enough to act on.",
                        "rungs": [
                            "both controls drawn from one category",
                            "vague answers such as 'educate users' with no mechanism",
                        ],
                    },
                ],
            },
            {
                "code": "3.3",
                "title": "protecting networks: segmentation",
                "scenario": "student laptops, teacher devices, and servers sit on one flat network; a compromised chromebook can reach the gradebook database admin port directly.",
                "evidence": "all devices: 10.10.0.0/16 with no vlans\nscan from a student laptop: gradebook db admin port 5432 answered in 40ms\nzoning: none between student, staff, and server segments",
                "task": "propose three segments with one allowed and one blocked flow each, and explain how segmentation limits an incident after a chromebook is compromised.",
                "questions": [
                    {
                        "text": "a student chromebook reached the gradebook database admin port in 40ms. which condition made that possible?",
                        "options": [
                            "the database uses a weak password",
                            "the chromebook is out of warranty",
                            "the firewall is stateless",
                            "student, staff, and server devices share one flat network with no zoning",
                        ],
                        "answer": 3,
                    },
                    {
                        "text": "which segmentation design most limits blast radius after a chromebook is compromised?",
                        "options": [
                            "one vlan per device so traffic is easy to trace",
                            "separate student and staff vlans but keep servers on the student vlan for speed",
                            "student, staff, and server zones with default-deny filters between them",
                            "a single server zone reachable from every user zone",
                        ],
                        "answer": 2,
                    },
                    {
                        "text": "which flow should a boundary rule allow for the student zone?",
                        "options": [
                            "student zone to internet https through the district proxy",
                            "student zone to gradebook database port 5432",
                            "student zone to staff vlans on all ports",
                            "any zone to the server zone management port",
                        ],
                        "answer": 0,
                    },
                    {
                        "text": "segmentation is proposed but rejected as 'too complex.' what is the strongest rebuttal?",
                        "options": [
                            "segments make traffic faster because packets travel shorter distances",
                            "the flat network already let a student device reach a database admin port - complexity is cheaper than one breach",
                            "segmentation removes the need for backups",
                            "vlan tags increase internet bandwidth",
                        ],
                        "answer": 1,
                    },
                ],
                "frq": [
                    {
                        "points": 3,
                        "verb": "identify",
                        "text": "identify the flat-network condition that most increases blast radius and cite the evidence for it.",
                        "answer": "no zoning between student, staff, and server devices on a single 10.10.0.0/16 - evidenced by a student laptop reaching the gradebook database admin port directly, with 5432 answering in 40ms.",
                        "full_credit": "names the absence of segmentation and cites the reachable admin port from a student device.",
                        "rungs": [
                            "describes 'too many devices' without citing zoning",
                            "cites the port but not who could reach it",
                        ],
                    },
                    {
                        "points": 4,
                        "verb": "describe",
                        "text": "describe three segments and one allowed plus one blocked flow on each boundary.",
                        "answer": "student zone (vlan 30): allowed web/https to the internet through the proxy, blocked 10.10.5.0/24 servers. staff zone (vlan 20): allowed gradebook ui on 443, blocked db admin on 5432. server zone (vlan 10): allowed intra-zone replication and management from the jump host, blocked any inbound from vlan 30.",
                        "full_credit": "three named zones each with a concrete allowed and blocked flow.",
                        "rungs": [
                            "zones named but flows missing or reversed so admin ports are allowed",
                            "only two segments or a generic 'split the network'",
                        ],
                    },
                    {
                        "points": 4,
                        "verb": "explain",
                        "text": "explain how segmentation limits an incident after a student chromebook is compromised.",
                        "answer": "by default the attacker can only reach the student zone, so lateral movement into staff and server zones requires crossing a filter with an explicit deny; logs on that boundary localize the attempt, shrinking both blast radius and dwell time.",
                        "full_credit": "links default-deny boundaries to contained lateral movement and observable pivot attempts.",
                        "rungs": [
                            "says segmentation only makes traffic faster or saves bandwidth",
                            "mentions privacy without containment",
                        ],
                    },
                ],
            },
            {
                "code": "3.4",
                "title": "protecting networks: firewalls",
                "scenario": "the district firewall must let teachers reach the gradebook admin console while students get only the public site; the rule set was written as allow all then deny the bad stuff.",
                "evidence": "rule 1: allow any to any (legacy)\nrule 2: deny student subnet to 10.10.5.10:8443\nrule 3: allow teacher subnet to 10.10.5.10:8443\nhit counts: rule 1 matched 12,400 sessions, rule 2 matched 0",
                "task": "explain why rule 2 never fires, write an ordered rule set that meets the requirement, and justify the default action.",
                "questions": [
                    {
                        "text": "rule 1 allows any to any; rule 2 denies the student subnet to 10.10.5.10:8443. rule 2 shows zero hits. why?",
                        "options": [
                            "the deny rule contains a typo in the port number",
                            "deny rules are evaluated only during nightly reboots",
                            "rules evaluate top-down and first match wins, so rule 1 already matched the traffic",
                            "hit counters reset every time the policy saves",
                        ],
                        "answer": 2,
                    },
                    {
                        "text": "which ordered rule set correctly implements the requirement?",
                        "options": [
                            "deny any to 8443; allow any to any; allow teachers to 8443",
                            "allow teachers to 10.10.5.10:8443; allow students to public web only; deny any to 8443; default deny",
                            "allow any to any; deny students to 8443",
                            "allow students to 8443; allow teachers to 8443; default allow",
                        ],
                        "answer": 1,
                    },
                    {
                        "text": "why must specific allows be placed before general rules?",
                        "options": [
                            "specific rules run faster on modern hardware",
                            "general rules cannot contain port numbers",
                            "deny rules always precede allow rules by convention",
                            "first-match evaluation means earlier rules shadow later ones, so specifics must come first",
                        ],
                        "answer": 3,
                    },
                    {
                        "text": "what does a default-deny final rule accomplish?",
                        "options": [
                            "anything not explicitly permitted is blocked, so undocumented services stay invisible",
                            "all backup traffic is automatically permitted",
                            "the firewall stops logging",
                            "teachers receive admin access",
                        ],
                        "answer": 0,
                    },
                ],
                "frq": [
                    {
                        "points": 4,
                        "verb": "explain",
                        "text": "explain why rule 2 matched zero sessions while the admin console is still reachable from the student subnet.",
                        "answer": "firewall rules evaluate top-down and the first match wins; rule 1 (allow any to any) matches student traffic before rule 2 is ever consulted, so the deny never applies. the hit counts confirm it: rule 1 matched 12,400 sessions, rule 2 matched 0.",
                        "full_credit": "states first-match top-down evaluation and reads the hit counts as confirmation.",
                        "rungs": [
                            "says the rule is wrong without explaining evaluation order",
                            "claims rules evaluate bottom-up",
                        ],
                    },
                    {
                        "points": 4,
                        "verb": "describe",
                        "text": "describe an ordered rule set that implements the requirement.",
                        "answer": "1) allow teacher subnet to 10.10.5.10:8443; 2) allow student subnet to the public gradebook site on 443 only; 3) deny any to 10.10.5.10:8443; 4) default deny all other traffic. specific allows first, explicit deny on the admin port, default deny last.",
                        "full_credit": "specific allows for both legitimate flows, an explicit deny on the admin port, and a default deny.",
                        "rungs": [
                            "correct allows but no default deny",
                            "keeps the allow-any rule anywhere in the set",
                        ],
                    },
                    {
                        "points": 4,
                        "verb": "justify",
                        "text": "justify the default-deny choice for a school network.",
                        "answer": "default deny blocks anything not explicitly permitted, so new or forgotten services stay invisible to outsiders and every allow becomes a documented, reviewable decision. for a school holding student data the cost of an unintended exposure outweighs the convenience of open access.",
                        "full_credit": "argues least privilege and reviewable exceptions against a concrete cost of default-allow.",
                        "rungs": [
                            "asserts deny is safer with no reasoning",
                            "argues default-allow for convenience without addressing student data",
                        ],
                    },
                ],
            },
            {
                "code": "3.5",
                "title": "detecting network attacks",
                "scenario": "the siem raises two alerts in the same hour: an icmp flood toward the broadcast address from spoofed external ips, and arp replies announcing one gateway ip from two mac addresses.",
                "evidence": "icmp: requests to 10.10.255.255 up 4000%, sources spoofed\narp: gateway 10.10.0.1 seen from mac aa:11 and mac bb:22 within 8 seconds\ndetection: signature 'icmp-broadcast-flood' matched; anomaly model flagged the arp pattern as novel",
                "task": "identify both attacks, decide which detection method surfaced each and why, and name one mitigation for each.",
                "questions": [
                    {
                        "text": "icmp to the broadcast address rose 4000% from spoofed external ips. which label best fits this traffic?",
                        "options": [
                            "a reconnaissance port scan",
                            "a smurf-style amplification denial of service",
                            "a dns cache poisoning attempt",
                            "an arp spoofing attack",
                        ],
                        "answer": 1,
                    },
                    {
                        "text": "the arp alert showed one gateway ip from two mac addresses within 8 seconds. why did the anomaly model flag it instead of a signature?",
                        "options": [
                            "signatures cannot inspect arp traffic",
                            "the anomaly model was misconfigured",
                            "two mac addresses are always legitimate",
                            "legitimate failover cases exist, so a fixed rule would false-positive - baseline deviation catches it",
                        ],
                        "answer": 3,
                    },
                    {
                        "text": "which mitigation belongs at the switch layer for the arp pattern?",
                        "options": [
                            "dynamic arp inspection with dhcp snooping so only trusted bindings are accepted",
                            "ingress filtering for spoofed external sources",
                            "disabling icmp on all routers",
                            "increasing the siem retention window",
                        ],
                        "answer": 0,
                    },
                    {
                        "text": "which evidence best distinguishes the icmp event as an attack rather than a backup job?",
                        "options": [
                            "the volume of traffic only",
                            "the destination was a broadcast address",
                            "the traffic volume, broadcast destination, and spoofed sources together",
                            "the time of day it occurred",
                        ],
                        "answer": 2,
                    },
                ],
                "frq": [
                    {
                        "points": 4,
                        "verb": "identify",
                        "text": "identify both attacks and give the detail that distinguishes each.",
                        "answer": "an icmp amplification or smurf-style flood - a 4000% rise toward the broadcast address from spoofed sources; and arp spoofing - the same gateway ip advertised from two mac addresses within 8 seconds.",
                        "full_credit": "both attacks named with the distinguishing evidence for each.",
                        "rungs": [
                            "one attack correct, the other only described generically as a ddos",
                            "symptoms listed without attack names",
                        ],
                    },
                    {
                        "points": 4,
                        "verb": "justify",
                        "text": "justify why the arp alert came from the anomaly model while the icmp alert came from a signature.",
                        "answer": "signatures match known, previously characterized patterns - an icmp broadcast flood has a stable shape, so a rule fires reliably. arp announcing one gateway from two macs has legitimate explanations such as failover, so a fixed rule would false-positive; a behavioral baseline catches the deviation as novel.",
                        "full_credit": "contrasts known-pattern matching with baseline deviation and ties each alert to its method.",
                        "rungs": [
                            "says signatures are better without the tradeoff",
                            "mentions false positives but not why this arp case needs them",
                        ],
                    },
                    {
                        "points": 4,
                        "verb": "describe",
                        "text": "describe one mitigation for each attack.",
                        "answer": "icmp: ingress filtering for spoofed sources at the edge (bcp38/u-rpf), rate-limit icmp, and disable directed broadcast on routers. arp: dynamic arp inspection with dhcp snooping on switches so only trusted bindings are accepted, plus port security limiting macs per port.",
                        "full_credit": "one concrete mitigation per attack at the correct layer: edge or router for icmp, switch for arp.",
                        "rungs": [
                            "one mitigation total",
                            "mitigations at the wrong layer, such as changing the wifi password",
                        ],
                    },
                ],
            },
        ],
    },
    {
        "title": "securing devices",
        "description": "assessment practice for device vulnerabilities, authentication, endpoint hardening, and device attack detection.",
        "order_index": 4,
        "topics": [
            {
                "code": "4.1",
                "title": "device vulnerabilities and attacks",
                "scenario": "a shared cart laptop was found with a usb drive still inserted and a sticky note taped over the camera; a review shows the cart's devices have not been patched in nine months.",
                "evidence": "patch age: 9 months, 34 updates pending\naccounts: shared local 'classroom' account with admin rights, screen lock disabled\nusb: storage devices autorun-mounted for all users\nincident: unknown usb drive found and inserted by a student, no record of its origin",
                "task": "rank the device risks by immediacy, explain how the shared admin account amplifies each, and produce a hardening checklist with one detection control.",
                "questions": [
                    {
                        "text": "which configuration turns any 30-second physical access into persistent control?",
                        "options": [
                            "a shared local admin account with the screen lock disabled",
                            "a nine-month-old desktop wallpaper",
                            "usb storage mounted read-only",
                            "the camera taped over",
                        ],
                        "answer": 0,
                    },
                    {
                        "text": "a student inserted an unknown usb drive into the cart laptop. what is the most immediate device-level risk?",
                        "options": [
                            "the drive's label may be misleading",
                            "the drive could be dropped again",
                            "the laptop's warranty may be void",
                            "the drive can carry payloads that execute against unpatched components",
                        ],
                        "answer": 3,
                    },
                    {
                        "text": "why does the shared 'classroom' admin account matter more than the patch gap for attribution?",
                        "options": [
                            "shared accounts patch faster",
                            "every action on the device maps to the same identity, so no log distinguishes users",
                            "admin accounts cannot be logged",
                            "the screen lock disables logging",
                        ],
                        "answer": 1,
                    },
                    {
                        "text": "which single change most reduces risk while keeping the cart usable for class?",
                        "options": [
                            "remove the usb ports entirely with epoxy",
                            "disable the screen lock to save battery",
                            "switch to per-user standard accounts with auto-updates and usb allowlisting",
                            "keep everything and post a warning sign",
                        ],
                        "answer": 2,
                    },
                ],
                "frq": [
                    {
                        "points": 4,
                        "verb": "identify",
                        "text": "identify the two configurations that most increase risk and cite how each is evidenced.",
                        "answer": "the shared local admin account with screen lock disabled (any user holds full privileges and the session is reachable whenever the cart is unattended), and usb storage mounted for all users (arbitrary files mount or execute without approval). both are stated directly in the evidence.",
                        "full_credit": "two configurations named, each tied to a line in the evidence.",
                        "rungs": [
                            "names only one configuration",
                            "lists risks such as 'old software' without naming configurations",
                        ],
                    },
                    {
                        "points": 4,
                        "verb": "explain",
                        "text": "explain how the nine-month patch gap turns a minor usb incident into a bigger one.",
                        "answer": "unpatched systems carry known, published exploits; an unknown usb payload can use fixed-but-uninstalled vulnerabilities to escalate from the shared account to full control, and with a shared identity and no screen lock, no log separates the students who used the device.",
                        "full_credit": "links known-exploit exposure plus shared identity to escalation and attribution loss.",
                        "rungs": [
                            "says patching is good practice without the escalation link",
                            "blames the student's curiosity only",
                        ],
                    },
                    {
                        "points": 3,
                        "verb": "describe",
                        "text": "describe a hardening checklist for the cart and one detection control.",
                        "answer": "per-user named accounts with standard rights, screen lock within five minutes, usb storage blocked except for allowlisted staff devices, automatic approved updates, and full-disk encryption. detection: centrally collected process and usb-mount logs with an alert on unknown executables or first-insert events.",
                        "full_credit": "hardening items covering identity, lock, usb, and updates plus one logging or alerting control.",
                        "rungs": [
                            "hardening list missing identity or usb items",
                            "detection control vague, such as 'monitor the laptop'",
                        ],
                    },
                ],
            },
            {
                "code": "4.2",
                "title": "authentication",
                "scenario": "a student club account shares one password across email, file storage, and social media, and the password was posted in the group chat last week; a member's personal account appeared in a breach dump yesterday.",
                "evidence": "reuse: same password across 3 services\nsharing: posted in group chat, 14 members\nmfa: off on all three services\nbreach: member's credential pair found in a public dump dated yesterday",
                "task": "explain why the reuse pattern is the primary risk, classify the authentication factors in use, and design a fix that adds a second factor without blocking shared club workflows.",
                "questions": [
                    {
                        "text": "the same password works on three services. which attack makes this dangerous the moment one service is breached?",
                        "options": [
                            "shoulder surfing",
                            "session hijacking",
                            "credential stuffing against the other services",
                            "tailgating",
                        ],
                        "answer": 2,
                    },
                    {
                        "text": "which change adds a possession factor for the club?",
                        "options": [
                            "a longer passphrase shared with all members",
                            "an authenticator app code on each officer's phone",
                            "a password stored in the group chat",
                            "the same password on fewer devices",
                        ],
                        "answer": 1,
                    },
                    {
                        "text": "the password was posted in a group chat with 14 members. what is the core problem?",
                        "options": [
                            "the secret is outside any access control - every member, and anyone who later joins or reads history, holds it",
                            "group chats are slower than email",
                            "the password will expire sooner",
                            "the chat compresses the message",
                        ],
                        "answer": 0,
                    },
                    {
                        "text": "after rotating the password, why must active sessions also be revoked?",
                        "options": [
                            "sessions consume server memory",
                            "revoking sessions resets the mfa enrollment",
                            "rotation only changes what is stored, not network access",
                            "tokens issued before rotation remain valid until revoked - otherwise an attacker keeps access",
                        ],
                        "answer": 3,
                    },
                ],
                "frq": [
                    {
                        "points": 4,
                        "verb": "explain",
                        "text": "explain why one breached personal account threatens the club's email and file storage.",
                        "answer": "credential stuffing: breach dumps are tested automatically against common services, and because the same password is reused, one valid pair unlocks all three. time-to-exploit is minutes, well before the breach makes the news.",
                        "full_credit": "names credential stuffing or automated reuse testing and connects it to the shared password.",
                        "rungs": [
                            "says 'passwords should be strong' without reuse mechanics",
                            "mentions the breach but not the cross-service link",
                        ],
                    },
                    {
                        "points": 3,
                        "verb": "identify",
                        "text": "identify the authentication factors in use and the missing factor that best fits a club's shared workflow.",
                        "answer": "only a knowledge factor (something you know) is in use. missing: a possession factor - an authenticator app or hardware token on the officers' devices, paired with a shared vault entry for the club password so sharing never means posting in chat.",
                        "full_credit": "classifies the current factor and proposes a possession-based second factor plus a vault for sharing.",
                        "rungs": [
                            "calls the password a possession factor",
                            "recommends another password or biometrics for shared accounts",
                        ],
                    },
                    {
                        "points": 4,
                        "verb": "describe",
                        "text": "describe a remediation sequence for all 14 members.",
                        "answer": "rotate to a unique vault-managed password, enable mfa on email first (highest value), then storage and social, revoke sessions on all three services, remove the chat post, and audit recent logins for unfamiliar locations. the vault replaces chat posting for ongoing sharing.",
                        "full_credit": "ordered steps: rotate, enable mfa by priority, revoke sessions, remove exposure, audit, vault.",
                        "rungs": [
                            "only 'change the password'",
                            "mfa recommended but no session revocation or audit",
                        ],
                    },
                ],
            },
            {
                "code": "4.3",
                "title": "protecting devices",
                "scenario": "an unknown remote-access tool is running on a lab computer, installed by a student who 'needed to help at home'; the lab firewall is off, updates are pending, and every user has install rights.",
                "evidence": "remote access: unknown tool listening on 443, session opened 9:14 pm\nfirewall: disabled on this host, enabled elsewhere\nupdates: 34 pending, last approved install 6 weeks ago\nrights: all lab users are local admins",
                "task": "explain how each gap contributed, write a hardening baseline for the lab, and state which control would have prevented the install.",
                "questions": [
                    {
                        "text": "what most directly allowed the remote-access tool to install without an elevation prompt?",
                        "options": [
                            "the firewall being disabled",
                            "the six-week-old update cycle",
                            "the tool listening on port 443",
                            "every lab user holding local admin rights",
                        ],
                        "answer": 3,
                    },
                    {
                        "text": "the host firewall is off on this machine but on everywhere else. what risk does that gap create?",
                        "options": [
                            "inbound connections the other hosts would drop are accepted here, exposing the listening port",
                            "the computer runs out of disk space",
                            "updates install too quickly",
                            "the screen lock engages too often",
                        ],
                        "answer": 0,
                    },
                    {
                        "text": "which control would best prevent a repeat of this specific install?",
                        "options": [
                            "a longer screen timeout",
                            "moving the lab to a different room",
                            "application allowlisting with installation rights restricted to it staff",
                            "disabling the antivirus",
                        ],
                        "answer": 2,
                    },
                    {
                        "text": "why does keeping the tool's listener on port 443 matter to the attacker?",
                        "options": [
                            "connections on 443 are automatically logged as trusted",
                            "it blends with normal https traffic, evading simple port-based filtering and review",
                            "port 443 disables the host firewall",
                            "port 443 cannot be monitored by the siem",
                        ],
                        "answer": 1,
                    },
                ],
                "frq": [
                    {
                        "points": 4,
                        "verb": "explain",
                        "text": "explain how 'all users are local admins' turned a late-night session into a foothold.",
                        "answer": "local admin rights mean the tool could install a service, open a listening port, disable security tools, and persist across reboots without any elevation prompt; the same rights let it survive logoff. least privilege would have forced a visible elevation and blocked persistence.",
                        "full_credit": "ties admin rights to silent installation, persistence, and disabled security tooling.",
                        "rungs": [
                            "says 'admins are bad' with no mechanism",
                            "blames only the student's choices",
                        ],
                    },
                    {
                        "points": 4,
                        "verb": "describe",
                        "text": "describe a hardening baseline for the lab.",
                        "answer": "standard user accounts for students with local admin restricted to it; host firewall enabled with default-deny inbound and explicit allows for required services; automatic approved updates in a weekly install window; application allowlisting for installations; remote-access tools permitted only from the management vlan.",
                        "full_credit": "covers accounts, firewall, updates, allowlisting, and remote-access restriction with specifics.",
                        "rungs": [
                            "only 'turn on the firewall'",
                            "includes disabling usb without justification or omits accounts",
                        ],
                    },
                    {
                        "points": 3,
                        "verb": "identify",
                        "text": "identify one detective control that would have flagged the session at 9:14 pm.",
                        "answer": "centralized log alerting on new listening ports and outbound connections outside maintenance hours, or an edr rule flagging remote-access binaries that are not on the approved inventory.",
                        "full_credit": "one concrete detection tied to listening ports, after-hours connections, or unapproved binaries.",
                        "rungs": [
                            "names a preventive control instead",
                            "vague 'check the logs' with no trigger condition",
                        ],
                    },
                ],
            },
            {
                "code": "4.4",
                "title": "detecting attacks on devices",
                "scenario": "a workstation shows 36 failed logins after midnight, an unknown process started at 12:41 am, and a startup setting was changed the same night; the next morning an outbound connection to an unfamiliar ip was observed.",
                "evidence": "auth: 36 failed logins, one success at 12:39 am from a new source ip\nprocess: unknown executable with an invalid publisher signature, started 12:41 am\npersistence: new startup entry pointing to the same executable\nnetwork: outbound https to 198.51.100.77, seen once at 12:44 am",
                "task": "classify the indicators as behavior-based or attribute-based, explain why the sequence matters, and outline containment plus eradication steps.",
                "questions": [
                    {
                        "text": "36 failed logins then one success at 12:39 am. how should this be classified?",
                        "options": [
                            "attribute-based, because it involves account names",
                            "behavior-based, because it is a sequence and timing pattern rather than a static string",
                            "neither, because login failures are normal",
                            "attribute-based, because it counts events",
                        ],
                        "answer": 1,
                    },
                    {
                        "text": "a new startup entry points to the same unknown executable. what does this indicate?",
                        "options": [
                            "the user changed a wallpaper preference",
                            "the executable is digitally signed and trusted",
                            "the attacker established persistence to survive reboots",
                            "the antivirus created a backup entry",
                        ],
                        "answer": 2,
                    },
                    {
                        "text": "the correct first response action is to:",
                        "options": [
                            "delete the executable to remove the threat",
                            "reboot the workstation to clear the process",
                            "ask the user what they downloaded",
                            "isolate the host while preserving volatile evidence",
                        ],
                        "answer": 3,
                    },
                    {
                        "text": "which single indicator is least useful for fleet-wide blocking?",
                        "options": [
                            "one failed-login count, because thresholds vary by environment and it names no host or file",
                            "the file hash of the unknown executable",
                            "the outbound ip 198.51.100.77",
                            "the startup entry path",
                        ],
                        "answer": 0,
                    },
                ],
                "frq": [
                    {
                        "points": 4,
                        "verb": "identify",
                        "text": "identify which evidence is behavior-based and which is attribute-based.",
                        "answer": "behavior-based: the sequence of 36 failures then a success, a new process starting at an odd hour, a startup entry appearing, and a one-off outbound connection. attribute-based: the executable's name or hash and the ip 198.51.100.77 - static indicators usable in blocklists.",
                        "full_credit": "correctly splits sequence, timing, and persistence behavior from static file and ip indicators.",
                        "rungs": [
                            "classifies everything generically as 'logs'",
                            "swaps the two categories",
                        ],
                    },
                    {
                        "points": 4,
                        "verb": "explain",
                        "text": "explain why the timeline of failures, process, startup entry, and outbound connection is stronger evidence than any single line.",
                        "answer": "each stage corroborates the next: a failed brute force then a successful login delivers the payload, the payload registers for persistence before it connects out - a kill-chain pattern. isolated lines have innocent explanations; the ordered sequence does not.",
                        "full_credit": "explains kill-chain corroboration: the ordered stages rule out coincidence.",
                        "rungs": [
                            "says 'more evidence is better' without the ordering",
                            "treats the outbound ip as the only proof",
                        ],
                    },
                    {
                        "points": 4,
                        "verb": "describe",
                        "text": "describe containment, eradication, and recovery for this host.",
                        "answer": "containment: isolate from the network and preserve memory and disk image before any change. eradication: remove the startup entry and executable, scan with updated tooling, rotate credentials used on the host, and hunt the ip and file hash across the fleet. recovery: restore a known-good state, patch the exploited vector, restore monitoring, and watch for recurrence.",
                        "full_credit": "all three phases with at least one concrete action each, including evidence preservation before eradication.",
                        "rungs": [
                            "only 'wipe and reinstall'",
                            "no credential rotation or fleet-wide hunt",
                        ],
                    },
                ],
            },
        ],
    },
    {
        "title": "securing applications and data",
        "description": "assessment practice for application/data attacks, access control, cryptography, secure applications, and detection.",
        "order_index": 5,
        "topics": [
            {
                "code": "5.1",
                "title": "application and data vulnerabilities and attacks",
                "scenario": "a student signup form stores names, emails, and medical notes; the search box accepts raw input, and a tester typed ' OR '1'='1 and received every record.",
                "evidence": "input: ' OR '1'='1\nresult: all 1,240 records returned in one response\nfields exposed: name, email, medical notes\nlogging: disabled for the search endpoint",
                "task": "identify the vulnerability class, explain why this is both an application and a data problem, and describe parameterization plus one monitoring control.",
                "questions": [
                    {
                        "text": "' OR '1'='1 returned all 1,240 records. what does this prove about the query?",
                        "options": [
                            "the endpoint requires authentication",
                            "the database is out of disk space",
                            "user input was concatenated into the query rather than bound as a parameter",
                            "the records are publicly available by design",
                        ],
                        "answer": 2,
                    },
                    {
                        "text": "which change most reliably prevents this class of flaw?",
                        "options": [
                            "prepared statements that separate query structure from data",
                            "blacklisting the string ' OR '",
                            "disabling the search endpoint",
                            "hashing the medical notes field",
                        ],
                        "answer": 0,
                    },
                    {
                        "text": "why do the medical notes raise the severity of this finding beyond other fields?",
                        "options": [
                            "medical notes are stored in larger files",
                            "medical notes cannot be encrypted",
                            "medical notes are never needed by the application",
                            "their disclosure is a health-data privacy breach with outsized harm to individuals",
                        ],
                        "answer": 3,
                    },
                    {
                        "text": "the search endpoint has logging disabled. what does that cost during incident response?",
                        "options": [
                            "the database runs slower without logs",
                            "there is no record of what the attacker queried or how much data left",
                            "the app cannot store records at all",
                            "parameterized queries stop working",
                        ],
                        "answer": 1,
                    },
                ],
                "frq": [
                    {
                        "points": 4,
                        "verb": "identify",
                        "text": "identify the vulnerability and the evidence that confirms it.",
                        "answer": "sql injection through unsanitized input concatenated into a query. confirmed by the tautology payload returning all 1,240 records and the exposed medical-notes field in the response.",
                        "full_credit": "names sql injection and cites both the payload result and the exposed fields.",
                        "rungs": [
                            "names 'injection' without the sql or query element",
                            "calls it a password problem",
                        ],
                    },
                    {
                        "points": 4,
                        "verb": "explain",
                        "text": "explain why this is simultaneously an application security problem and a data protection problem.",
                        "answer": "application side: the code builds queries from untrusted input, letting an attacker change query logic. data side: the same flaw discloses sensitive personal and medical data at scale - a privacy breach with notification duties, no matter how well the app is hosted.",
                        "full_credit": "two-sided answer: input-handling flaw in code plus bulk sensitive-data disclosure with privacy consequences.",
                        "rungs": [
                            "addresses only one side",
                            "says 'it's just a bug' with no data impact",
                        ],
                    },
                    {
                        "points": 4,
                        "verb": "describe",
                        "text": "describe the code-level fix and one monitoring control.",
                        "answer": "parameterized queries or prepared statements so user input is never parsed as sql, backed by least-privilege database credentials and allowlisted columns. monitoring: log and alert on anomalous query shapes, error-message spikes, or result-set sizes far above normal for the endpoint.",
                        "full_credit": "parameterization as the primary fix plus a concrete detection signal such as query shape, error spike, or volume.",
                        "rungs": [
                            "recommends input blacklists or escaping only",
                            "monitoring suggestion unrelated to queries",
                        ],
                    },
                ],
            },
            {
                "code": "5.2",
                "title": "protecting applications and data: managerial controls and access controls",
                "scenario": "every club officer account can view and edit every student record including fields unrelated to their role, exports are not logged, and a former officer's account was never deprovisioned.",
                "evidence": "roles: officer, advisor, admin - identical permissions on all records\nfields: officers can edit medical notes they never need\nexports: none logged\nreviews: no access review, no offboarding checklist",
                "task": "apply least privilege with a role and permission table, classify the missing controls, and explain why export logging matters more than login logging here.",
                "questions": [
                    {
                        "text": "all officers can edit medical notes. which principle is violated?",
                        "options": [
                            "defense in depth",
                            "least privilege - access limited to what the role requires",
                            "availability",
                            "nonrepudiation",
                        ],
                        "answer": 1,
                    },
                    {
                        "text": "exports are not logged while logins are. what is the consequence?",
                        "options": [
                            "exports fail silently",
                            "login logs become unreadable",
                            "the database grows slower",
                            "bulk data theft looks like ordinary successful logins",
                        ],
                        "answer": 3,
                    },
                    {
                        "text": "a former officer's account still works three months after departure. what does this demonstrate?",
                        "options": [
                            "access drift from the absence of deprovisioning and periodic review",
                            "the officer's password was too strong",
                            "mfa shortens account lifetime",
                            "that offboarding is only a technical problem",
                        ],
                        "answer": 0,
                    },
                    {
                        "text": "which permission design best matches least privilege for officers?",
                        "options": [
                            "one shared officer account for simplicity",
                            "all fields for all officers so work is never blocked",
                            "field-level grants scoped to their cohort, with export as a separate approval",
                            "read-only access with the password shared publicly",
                        ],
                        "answer": 2,
                    },
                ],
                "frq": [
                    {
                        "points": 4,
                        "verb": "describe",
                        "text": "describe a role and permission table for officer, advisor, and admin.",
                        "answer": "officer: read and write contact fields for their own cohort, no medical notes, no bulk export. advisor: read all records for their club with comment rights, export only with a reason code. admin: account and configuration management, no routine record editing - separation of duties. every grant scoped by cohort, with write and export as separate permissions.",
                        "full_credit": "three roles with scoped field-level permissions and export separated from read.",
                        "rungs": [
                            "roles listed without permission detail",
                            "gives admin everything including bulk export with no separation of duties",
                        ],
                    },
                    {
                        "points": 4,
                        "verb": "explain",
                        "text": "explain why export logging matters more than login logging for this data.",
                        "answer": "logins reveal account access; exports reveal bulk data movement - the actual exfiltration signal. a compromised officer account exporting 1,240 records shows up only if export events are captured with row counts, actor, and destination. login logs would look entirely normal.",
                        "full_credit": "contrasts single-session access with bulk movement and names what an export log must capture.",
                        "rungs": [
                            "says 'log everything' without the distinction",
                            "claims login logs alone would catch it",
                        ],
                    },
                    {
                        "points": 4,
                        "verb": "identify",
                        "text": "identify the two missing managerial controls and the risk each addresses.",
                        "answer": "no periodic access review, so permissions drift and ex-employees retain access - exactly the former-officer case; and no offboarding or deprovisioning process, so stale accounts become unmonitored entry points. a written policy assigns owners and cadence to both.",
                        "full_credit": "names access review and offboarding, each tied to its risk.",
                        "rungs": [
                            "names only one control",
                            "calls them technical rather than managerial controls",
                        ],
                    },
                ],
            },
            {
                "code": "5.3",
                "title": "protecting stored data with cryptography",
                "scenario": "a laptop holding a roster export was lost after an event; it had no disk encryption, only a login password, and the backup restored successfully - but the roster also lives on a usb drive that is now missing.",
                "evidence": "disk encryption: off\nlogin: password only, no boot-time protection\nbackup: restored to the replacement device\nusb: roster export copied there last month, current location unknown",
                "task": "explain why the login password did not protect the roster, distinguish encryption at rest from encryption in transit here, and write the containment sequence.",
                "questions": [
                    {
                        "text": "why does full-disk encryption protect data that a login password cannot?",
                        "options": [
                            "the drive's contents are unreadable without the key, even if the disk is removed and read elsewhere",
                            "encryption changes the password format",
                            "encrypted drives cannot be lost",
                            "login passwords only protect network traffic",
                        ],
                        "answer": 0,
                    },
                    {
                        "text": "the roster was copied to a usb drive that is now missing. which statement is true?",
                        "options": [
                            "usb copies are protected by the laptop's encryption",
                            "the backup replaces the need to find the usb",
                            "each unencrypted copy carries its own exposure - the usb must be treated as disclosed",
                            "usb drives self-encrypt when removed",
                        ],
                        "answer": 2,
                    },
                    {
                        "text": "encryption in transit would have protected the roster during:",
                        "options": [
                            "storage on the laptop's hard drive",
                            "transfer across the network between the server and the laptop",
                            "the time the laptop sat powered off",
                            "printing to the office printer",
                        ],
                        "answer": 1,
                    },
                    {
                        "text": "which control combination best prevents a repeat of this incident?",
                        "options": [
                            "shorter passwords on the replacement laptop",
                            "disabling backups to avoid extra copies",
                            "renaming roster.csv to an innocuous filename",
                            "full-disk encryption plus controls on exports to removable media",
                        ],
                        "answer": 3,
                    },
                ],
                "frq": [
                    {
                        "points": 4,
                        "verb": "explain",
                        "text": "explain why the login password did not protect the roster on the lost laptop.",
                        "answer": "the password gates the operating system session, not the bits on the drive; without full-disk encryption the file is readable by removing the disk or booting other media. login authentication is not confidentiality for data at rest.",
                        "full_credit": "separates session authentication from data-at-rest confidentiality.",
                        "rungs": [
                            "says 'the password was weak'",
                            "confuses the backup with protection",
                        ],
                    },
                    {
                        "points": 4,
                        "verb": "describe",
                        "text": "distinguish encryption at rest and in transit for this roster and state where each applies.",
                        "answer": "at rest: no disk encryption on the laptop and no file-level encryption on the usb copy - both readable offline. in transit: roster transfers over the network should run under tls; if copied over an open network or emailed unencrypted, that path is exposed too. at rest is the confirmed gap; in transit must be verified.",
                        "full_credit": "defines both, maps each to a concrete location in this scenario, and flags which is confirmed missing.",
                        "rungs": [
                            "defines only one of the two",
                            "answers 'encrypt everything' with no mapping",
                        ],
                    },
                    {
                        "points": 3,
                        "verb": "describe",
                        "text": "describe the containment sequence now that the device is gone.",
                        "answer": "treat the roster as disclosed: assess notification duties for affected individuals, rotate any credentials that traveled with the export, locate or kill the missing usb copy through inventory and remote wipe if capable, and require encryption plus export controls for future copies.",
                        "full_credit": "notification assessment, credential rotation, usb recovery, and a prevention control.",
                        "rungs": [
                            "only 'change the password'",
                            "no mention of the usb copy",
                        ],
                    },
                ],
            },
            {
                "code": "5.4",
                "title": "asymmetric cryptography",
                "scenario": "a vendor ships a digitally signed software update and publishes its public key on the official site; a reviewer notes the signature verifies but the installer still asks for admin rights and the changelog claims 'bug fixes' only.",
                "evidence": "signature: valid against the published public key\nhash: sha-256 matches the downloaded file\nkey rotation: vendor rotated keys last month with no stated revocation process\ninstaller: requests elevation on first run",
                "task": "state exactly what the signature proves and does not prove, explain the key-rotation risk, and describe how a user should verify the update end to end.",
                "questions": [
                    {
                        "text": "what does a valid digital signature actually establish?",
                        "options": [
                            "the code contains no vulnerabilities",
                            "the update is free of bugs",
                            "the publisher's identity was verified by the school",
                            "the signed bytes are unchanged and were produced by the private-key holder",
                        ],
                        "answer": 3,
                    },
                    {
                        "text": "why does the unsigned changelog matter?",
                        "options": [
                            "changelogs must be hashed separately by law",
                            "claims about what the update does sit outside the signature's coverage - only the binary's bytes are covered",
                            "unsigned files automatically become signed",
                            "changelogs affect the sha-256 of the installer",
                        ],
                        "answer": 1,
                    },
                    {
                        "text": "the vendor rotated its signing keys. which control lets clients reject an old compromised key?",
                        "options": [
                            "a published revocation list or a pinned current-key fingerprint",
                            "a longer changelog",
                            "the sha-256 of the installer",
                            "the admin prompt in the installer",
                        ],
                        "answer": 0,
                    },
                    {
                        "text": "the installer requests admin rights on first run. how does that interact with the valid signature?",
                        "options": [
                            "admin rights invalidate the signature",
                            "the signature guarantees elevation is safe",
                            "privileges are a separate risk - a legitimately signed installer can still require dangerous permissions",
                            "elevation causes the hash to change",
                        ],
                        "answer": 2,
                    },
                ],
                "frq": [
                    {
                        "points": 4,
                        "verb": "justify",
                        "text": "justify the claim 'a valid signature does not mean the update is safe.'",
                        "answer": "the signature proves only that the holder of the private key produced it over these exact bytes (authenticity) and that the bytes are unchanged (integrity). it says nothing about what the code does - the signed installer can still request admin rights and run arbitrary logic, and 'bug fixes' in the changelog is unsigned marketing text.",
                        "full_credit": "separates authenticity and integrity from author intent and code behavior, noting the unsigned changelog.",
                        "rungs": [
                            "says signatures 'can be faked' without explanation",
                            "claims the signature covers the changelog",
                        ],
                    },
                    {
                        "points": 4,
                        "verb": "explain",
                        "text": "explain the risk of key rotation without a revocation process.",
                        "answer": "without revocation, clients cannot distinguish the current key from a compromised or superseded one; an adversary holding a stolen old key can still sign updates that verify on unpatched clients. trust chains need a way to say 'this key is no longer authoritative.'",
                        "full_credit": "ties rotation without revocation to continued acceptance of stale or compromised keys.",
                        "rungs": [
                            "says rotation is 'good practice' with no stated risk",
                            "confuses public and private key rotation",
                        ],
                    },
                    {
                        "points": 3,
                        "verb": "describe",
                        "text": "describe how a user should verify this update end to end.",
                        "answer": "fetch the public key over an authenticated channel (official site over tls or pinned), verify the signature against it, compare the file's sha-256 to the published digest, confirm the key fingerprint matches previous communications, then review requested privileges before approving elevation.",
                        "full_credit": "verification chain including key provenance or fingerprint, not just 'check the signature'.",
                        "rungs": [
                            "only 'check the padlock'",
                            "verification steps with no key provenance",
                        ],
                    },
                ],
            },
            {
                "code": "5.5",
                "title": "protecting applications",
                "scenario": "a web team plans a student portal with login, profile editing, and file upload; error messages currently display full stack traces, and there are no input checks or access tests before launch.",
                "evidence": "validation: none on signup or upload\nerrors: stack traces with file paths sent to the browser\ntesting: no security test stage in the pipeline\nupdates: manual, whenever someone remembers",
                "task": "write three secure development requirements, explain why stack traces are a leak, and describe one pre-launch test.",
                "questions": [
                    {
                        "text": "a user uploads a profile photo. which check belongs server-side?",
                        "options": [
                            "a browser-side file-type dropdown",
                            "a javascript size warning",
                            "validated extension, content-type, and size limit, plus re-encoding on the server",
                            "a hidden form field marking the file as an image",
                        ],
                        "answer": 2,
                    },
                    {
                        "text": "why must file validation run again after upload rather than trusting the first check?",
                        "options": [
                            "client-side checks are attacker-controlled - the server must verify what actually arrives",
                            "browsers change file extensions",
                            "validation is faster on the server",
                            "files can only be renamed by the server",
                        ],
                        "answer": 0,
                    },
                    {
                        "text": "which finding should block a launch?",
                        "options": [
                            "a missing share-on-social button",
                            "a test account that can read another user's profile by changing the url id",
                            "an unused css class in the stylesheet",
                            "the login page loading in 1.2 seconds",
                        ],
                        "answer": 1,
                    },
                    {
                        "text": "secure error handling means:",
                        "options": [
                            "showing the stack trace only to logged-in users",
                            "returning 500 for every error with no detail at all, including in logs",
                            "logging every stack trace twice",
                            "generic messages to users, full detail in access-controlled logs",
                        ],
                        "answer": 3,
                    },
                ],
                "frq": [
                    {
                        "points": 4,
                        "verb": "describe",
                        "text": "describe three secure development requirements for the portal.",
                        "answer": "server-side input validation with typed allowlists and size limits; generic user-facing errors with full detail only in protected logs; enforced access control on every route (deny by default, per-object checks); and authenticated file upload handling with type, size, and content scanning.",
                        "full_credit": "three or more concrete requirements - validation, safe errors, access control - with specifics, not slogans.",
                        "rungs": [
                            "generic 'follow owasp' with no items",
                            "lists only one or two requirements",
                        ],
                    },
                    {
                        "points": 4,
                        "verb": "explain",
                        "text": "explain why displaying stack traces to users increases risk.",
                        "answer": "stack traces disclose framework versions, file paths, library names, and internal logic - a map for choosing known exploits against those components. an attacker fingerprints the stack from one error page without any probing.",
                        "full_credit": "links disclosed internals to component fingerprinting and exploit selection.",
                        "rungs": [
                            "says 'it looks unprofessional'",
                            "mentions information disclosure generically with no exploit link",
                        ],
                    },
                    {
                        "points": 3,
                        "verb": "justify",
                        "text": "justify putting a security test stage in the pipeline before launch.",
                        "answer": "catching injection, broken access control, and unsafe upload handling before launch is far cheaper than fixing them after data is exposed; a gated stage makes security repeatable for every change instead of a one-time review that drifts.",
                        "full_credit": "cost or shift-left argument plus repeatability across changes.",
                        "rungs": [
                            "only 'it saves time'",
                            "recommends testing after launch",
                        ],
                    },
                ],
            },
            {
                "code": "5.6",
                "title": "detecting attacks on data and applications",
                "scenario": "application logs show repeated failed admin requests from 1:47 to 2:13 am followed by a successful export at 2:14 am; the export was 40 mb and left for an unfamiliar external ip.",
                "evidence": "failures: 212 requests to /admin/export from one account\nsuccess: 2:14 am, 40 mb, destination 203.0.113.99\nbaseline: exports average 1.2 mb, daytime, from office ips\nalert: none - export volume is not monitored",
                "task": "identify the exfiltration indicators, explain why baseline comparison catches this where a fixed threshold does not, and outline alerting plus containment.",
                "questions": [
                    {
                        "text": "which single observation is the clearest exfiltration signal?",
                        "options": [
                            "a 40 mb export at 2:14 am to an unfamiliar external ip against a 1.2 mb daytime baseline",
                            "212 failed requests to an admin endpoint",
                            "the destination ip resolving to a cloud provider",
                            "the account being an administrator",
                        ],
                        "answer": 0,
                    },
                    {
                        "text": "212 failed requests preceded one success. why does the sequence matter?",
                        "options": [
                            "failures indicate the server was down",
                            "the failures prove the account was locked out",
                            "failed requests are unrelated background noise",
                            "persistence through repeated attempts followed by action is a kill-chain pattern",
                        ],
                        "answer": 3,
                    },
                    {
                        "text": "the alert never fired because:",
                        "options": [
                            "logs were disabled on the export endpoint",
                            "only absolute size is monitored, and 40 mb sits under the fixed threshold",
                            "the siem was offline that night",
                            "admin accounts are exempt from alerts",
                        ],
                        "answer": 1,
                    },
                    {
                        "text": "which containment step addresses the data that already left?",
                        "options": [
                            "restarting the application server",
                            "increasing the export size limit",
                            "assessing what was exported and notifying per breach procedure, not just blocking the ip",
                            "deleting the audit log to free space",
                        ],
                        "answer": 2,
                    },
                ],
                "frq": [
                    {
                        "points": 4,
                        "verb": "identify",
                        "text": "identify the strongest exfiltration indicators in the evidence.",
                        "answer": "the failure-then-success pattern at an unusual hour, a 40 mb export against a 1.2 mb daytime baseline, and an unfamiliar external destination ip - plus the absence of an alert, which shows detection coverage is missing.",
                        "full_credit": "at least three indicators, including the volume deviation and the destination.",
                        "rungs": [
                            "cites only the failed requests",
                            "treats the success alone as proof",
                        ],
                    },
                    {
                        "points": 4,
                        "verb": "explain",
                        "text": "explain why baseline comparison catches this where a fixed threshold does not.",
                        "answer": "a fixed 'over 10 mb' threshold misses this if set at 100 mb, or floods analysts if set at 1 mb. a baseline over time of day, user, and typical size makes a 33x deviation with an off-hours actor and a new destination an outlier worth alerting on, regardless of absolute size.",
                        "full_credit": "contrasts static thresholds with a behavioral baseline across multiple dimensions.",
                        "rungs": [
                            "says baselines are 'more accurate' with no mechanism",
                            "confuses a baseline with logging itself",
                        ],
                    },
                    {
                        "points": 3,
                        "verb": "describe",
                        "text": "describe alerting and containment for this incident.",
                        "answer": "alerting: a real-time rule on export volume deviation plus off-hours admin activity and new external destinations, routed to on-call. containment: revoke the session and rotate credentials, block the destination ip, suspend the export function pending review, preserve logs, and assess what left.",
                        "full_credit": "an alert rule tied to deviation and off-hours activity, plus containment covering session, credentials, destination, and evidence.",
                        "rungs": [
                            "only 'block the ip'",
                            "no log preservation or credential action",
                        ],
                    },
                ],
            },
        ],
    },
]


def assessment_content(unit_title: str, topic: dict) -> str:
    return f"""scenario/context

{topic["scenario"]}

evidence

{topic["evidence"]}

why this matters

{topic["risk"]}

pset response

{topic["pset"]}

submit a short written response after completing the multiple-choice check. cite the evidence you used and keep the answer specific to the scenario."""


def frq_markdown(frq: list[dict]) -> str:
    """student-facing question list: **q1. (n points, verb)** + prompt."""
    blocks = [
        f"**q{index}. ({question['points']} points, {question['verb']})**\n\n"
        f"{question['text']}"
        for index, question in enumerate(frq, start=1)
    ]
    return "\n\n".join(blocks) + "\n"


def case_study_content(topic: dict) -> str:
    """full case study page matching the imported teacher-guide layout."""
    parts = [f"## scenario\n\n{topic['scenario']}"]
    if topic.get("task"):
        parts.append(f"## your task\n\n{topic['task']}")
    parts.append(f"## evidence\n\n{topic['evidence']}")
    parts.append(f"## questions\n\n{frq_markdown(topic['frq'])}")
    return "\n\n".join(parts).rstrip() + "\n"


def case_study_answer_key(topic: dict) -> str:
    blocks = []
    for index, question in enumerate(topic["frq"], start=1):
        blocks.append(
            f"### q{index}. {question['verb']}\n\n{question['text']}\n\n"
            f"{question['answer']}"
        )
    return "\n\n".join(blocks) + "\n"


def case_study_rubric(topic: dict) -> str:
    blocks = []
    for index, question in enumerate(topic["frq"], start=1):
        rungs = "\n".join(f"- {rung}" for rung in question["rungs"])
        blocks.append(
            f"### q{index} - {question['points']} points ({question['verb']})\n\n"
            f"full credit: {question['full_credit']}\n\n{rungs}"
        )
    return "\n\n".join(blocks) + "\n"


def assessment_module(unit_data: dict) -> dict:
    lessons = []

    for index, topic in enumerate(unit_data["topics"], start=1):
        lesson = {
            "title": f"{topic['code']} {topic['title']}",
            "lesson_type": "case_study",
            "order_index": index,
            "video_url": None,
            "content": (
                case_study_content(topic)
                if topic.get("frq")
                else assessment_content(unit_data["title"], topic)
            ),
            "quiz": {
                "title": f"{topic['code']} check",
                "description": "four questions on this case study.",
                "questions": [
                    {
                        "question_text": item["text"],
                        "order_index": question_index,
                        # authored option order varies per question so the
                        # correct choice is not parked in one spot even before
                        # the serve-time shuffle
                        "options": [
                            {"option_text": option, "is_correct": position == item["answer"]}
                            for position, option in enumerate(item["options"])
                        ],
                    }
                    for question_index, item in enumerate(topic["questions"], start=1)
                ],
            },
        }

        if topic.get("frq"):
            # teacher-only grading material for hand-written placeholders
            lesson["points"] = sum(q["points"] for q in topic["frq"])
            lesson["answer_key_heading"] = frq_markdown(topic["frq"])
            lesson["answer_key"] = case_study_answer_key(topic)
            lesson["rubric"] = case_study_rubric(topic)

        lessons.append(lesson)

    return {
        "title": ASSESSMENT_MODULE_TITLE,
        "description": f"AP CED-aligned assessment pages for {unit_data['title']}.",
        "order_index": 1,
        "lessons": lessons,
    }


def upsert_unit(db: Session, unit_data: dict) -> Unit:
    unit = db.scalar(select(Unit).where(Unit.order_index == unit_data["order_index"]))

    if unit is None:
        unit = Unit(
            title=unit_data["title"],
            description=unit_data["description"],
            order_index=unit_data["order_index"],
        )
        db.add(unit)
        db.flush()
    else:
        unit.title = unit_data["title"]
        unit.description = unit_data["description"]

    return unit


def upsert_module(db: Session, unit: Unit, module_data: dict) -> Module:
    module = db.scalar(
        select(Module).where(
            Module.unit_id == unit.id,
            Module.order_index == module_data["order_index"],
        )
    )

    if module is None:
        module = Module(
            unit_id=unit.id,
            title=module_data["title"],
            description=module_data["description"],
            order_index=module_data["order_index"],
            is_hidden=module_data.get("is_hidden", False),
        )
        db.add(module)
        db.flush()
    else:
        module.title = module_data["title"]
        module.description = module_data["description"]
        module.is_hidden = module_data.get("is_hidden", False)

    return module


def upsert_lesson(db: Session, module: Module, lesson_data: dict) -> Lesson:
    lesson_values = {
        key: value for key, value in lesson_data.items() if key != "quiz"
    }
    lesson = db.scalar(
        select(Lesson).where(
            Lesson.module_id == module.id,
            Lesson.order_index == lesson_values["order_index"],
        )
    )

    if lesson is None:
        lesson = Lesson(module_id=module.id, **lesson_values)
        db.add(lesson)
        db.flush()
    elif lesson.variant is None:
        # imported case study lessons (variant set) own their content; seed
        # must never overwrite them or wipe their teacher-only columns
        lesson.title = lesson_values["title"]
        lesson.content = lesson_values["content"]
        lesson.video_url = lesson_values["video_url"]
        lesson.lesson_type = lesson_values["lesson_type"]
        for column in (
            "points",
            "answer_key",
            "answer_key_heading",
            "rubric",
            "teaching_notes",
            "metadata_text",
        ):
            if column in lesson_values:
                setattr(lesson, column, lesson_values[column])

    return lesson


def upsert_quiz(db: Session, lesson: Lesson, quiz_data: dict) -> Quiz:
    quiz = db.scalar(select(Quiz).where(Quiz.lesson_id == lesson.id))

    if quiz is None:
        quiz = Quiz(
            lesson_id=lesson.id,
            title=quiz_data["title"],
            description=quiz_data["description"],
        )
        db.add(quiz)
        db.flush()
    else:
        quiz.title = quiz_data["title"]
        quiz.description = quiz_data["description"]

    return quiz


def upsert_question(db: Session, quiz: Quiz, question_data: dict) -> QuizQuestion:
    question = db.scalar(
        select(QuizQuestion).where(
            QuizQuestion.quiz_id == quiz.id,
            QuizQuestion.order_index == question_data["order_index"],
        )
    )

    if question is None:
        question = QuizQuestion(
            quiz_id=quiz.id,
            question_text=question_data["question_text"],
            question_type="multiple_choice",
            order_index=question_data["order_index"],
        )
        db.add(question)
        db.flush()
    else:
        question.question_text = question_data["question_text"]
        question.question_type = "multiple_choice"

    return question


def upsert_options(
    db: Session,
    question: QuizQuestion,
    options_data: list[dict],
) -> None:
    wanted_text = {option_data["option_text"] for option_data in options_data}

    for option_data in options_data:
        option = db.scalar(
            select(QuizOption).where(
                QuizOption.question_id == question.id,
                QuizOption.option_text == option_data["option_text"],
            )
        )

        if option is None:
            option = QuizOption(
                question_id=question.id,
                option_text=option_data["option_text"],
                is_correct=option_data["is_correct"],
            )
            db.add(option)
        else:
            option.is_correct = option_data["is_correct"]

    stale_options = db.scalars(
        select(QuizOption).where(
            QuizOption.question_id == question.id,
            QuizOption.option_text.not_in(wanted_text),
        )
    )
    for option in stale_options:
        db.delete(option)


def sync_quiz(db: Session, lesson: Lesson, quiz_data: dict) -> None:
    """upsert the quiz, its questions, and options; drop removed questions."""
    quiz = upsert_quiz(db, lesson, quiz_data)

    for question_data in quiz_data["questions"]:
        question = upsert_question(db, quiz, question_data)
        upsert_options(db, question, question_data["options"])

    wanted_orders = {q["order_index"] for q in quiz_data["questions"]}
    stale_questions = db.scalars(
        select(QuizQuestion).where(
            QuizQuestion.quiz_id == quiz.id,
            QuizQuestion.order_index.not_in(wanted_orders),
        )
    ).all()
    for stale_question in stale_questions:
        db.delete(stale_question)


def remove_stale_seed_content(
    db: Session,
    module: Module,
    lesson_data: list[dict],
) -> None:
    wanted_lesson_orders = {lesson["order_index"] for lesson in lesson_data}
    stale_lessons = db.scalars(
        select(Lesson).where(
            Lesson.module_id == module.id,
            Lesson.order_index.not_in(wanted_lesson_orders),
            # imported variant lessons are not seed-owned
            Lesson.variant.is_(None),
        )
    )
    for lesson in stale_lessons:
        db.delete(lesson)

    # one topic assessment ships per topic: generator variant b make-ups are
    # an alternates pool for choosing from, never part of the course
    makeup_lessons = db.scalars(
        select(Lesson).where(
            Lesson.module_id == module.id,
            Lesson.variant == "B",
        )
    ).all()
    for lesson in makeup_lessons:
        db.delete(lesson)


def remove_legacy_modules(db: Session, unit: Unit, active_module: Module) -> None:
    legacy_modules = db.scalars(
        select(Module).where(
            Module.unit_id == unit.id,
            Module.id != active_module.id,
            Module.title.in_(LEGACY_MODULE_TITLES),
        )
    )
    for module in legacy_modules:
        db.delete(module)


def ensure_mock_exam_columns() -> None:
    with engine.begin() as connection:
        connection.execute(
            text("ALTER TABLE mock_exam_attempts ADD COLUMN IF NOT EXISTS exam_kind VARCHAR(10) NOT NULL DEFAULT 'full'")
        )
        connection.execute(
            text("ALTER TABLE mock_exam_attempts ADD COLUMN IF NOT EXISTS unit_id INTEGER")
        )
        connection.execute(
            text("ALTER TABLE mock_exam_attempts ADD COLUMN IF NOT EXISTS frq_response TEXT")
        )
        connection.execute(
            text("ALTER TABLE mock_exam_attempts ADD COLUMN IF NOT EXISTS frq_score DOUBLE PRECISION")
        )
        connection.execute(
            text("ALTER TABLE mock_exam_attempts ADD COLUMN IF NOT EXISTS frq_feedback TEXT")
        )
        connection.execute(
            text("ALTER TABLE mock_exam_attempts ADD COLUMN IF NOT EXISTS frq_contribution DOUBLE PRECISION NOT NULL DEFAULT 0")
        )
        connection.execute(
            text("ALTER TABLE mock_exam_attempts ADD COLUMN IF NOT EXISTS frq_part_scores TEXT")
        )
        connection.execute(
            text("ALTER TABLE mock_exam_attempts ADD COLUMN IF NOT EXISTS frq_reviewed BOOLEAN NOT NULL DEFAULT FALSE")
        )
        connection.execute(
            text("ALTER TABLE mock_exam_attempts ADD COLUMN IF NOT EXISTS frq_reviewed_at TIMESTAMP")
        )
        connection.execute(
            text("ALTER TABLE mock_exam_attempts ADD COLUMN IF NOT EXISTS frq_reviewed_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL")
        )

        # one-time backfill: attempts graded before frq_contribution existed
        # get their frq contribution recomputed from frq_score
        connection.execute(
            text(
                "UPDATE mock_exam_attempts "
                "SET frq_contribution = round(((frq_score / 14.0) * 30.0)::numeric, 2)::double precision "
                "WHERE frq_score IS NOT NULL AND frq_contribution = 0"
            )
        )


def seed_course() -> None:
    Base.metadata.create_all(bind=engine)
    ensure_review_columns()
    ensure_mock_exam_columns()

    with SessionLocal() as db:
        for unit_data in AP_MODULES:
            unit = upsert_unit(db, unit_data)

            module_data = assessment_module(unit_data)
            module = upsert_module(db, unit, module_data)

            for lesson_data in module_data["lessons"]:
                lesson = upsert_lesson(db, module, lesson_data)
                sync_quiz(db, lesson, lesson_data["quiz"])

            remove_stale_seed_content(db, module, module_data["lessons"])
            remove_legacy_modules(db, unit, module)

            # internal exam bank: hard ap questions live in a hidden module
            # per unit so mock exams can pull from them
            bank_data = exam_bank_module(unit_data["order_index"])
            bank_module = upsert_module(db, unit, bank_data)
            for lesson_data in bank_data["lessons"]:
                lesson = upsert_lesson(db, bank_module, lesson_data)
                sync_quiz(db, lesson, lesson_data["quiz"])

        db.commit()


def ensure_review_columns() -> None:
    with engine.begin() as connection:
        connection.execute(
            text(
                "ALTER TABLE case_study_responses "
                "ADD COLUMN IF NOT EXISTS reviewed BOOLEAN NOT NULL DEFAULT FALSE"
            )
        )
        connection.execute(
            text(
                "ALTER TABLE case_study_responses "
                "ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP"
            )
        )
        connection.execute(
            text(
                "ALTER TABLE case_study_responses "
                "ADD COLUMN IF NOT EXISTS reviewed_by_id INTEGER "
                "REFERENCES users(id) ON DELETE SET NULL"
            )
        )
        connection.execute(
            text(
                "ALTER TABLE case_study_responses "
                "ADD COLUMN IF NOT EXISTS feedback TEXT"
            )
        )


if __name__ == "__main__":
    seed_course()
    print("course seed complete")
