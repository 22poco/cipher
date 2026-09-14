"""
ap exam bank: hard multiple-choice questions and free-response questions
modeled on the official ap cybersecurity exam structure.

real exam: 60 mcq (80 min, 70%) + 1 device security analysis frq (50 min, 30%).
practice exams here are intentionally harder than the real thing:
full exam = 60 mcq + frq in 120 min. unit exams = 30 mcq + frq in 60 min.

mcq entries:
    unit = 1..5 (which unit exam the question belongs to)
    full_only = include in the 60-question full exam only
"""

FULL_MCQ_COUNT = 60
UNIT_MCQ_COUNT = 30
FULL_TIME_LIMIT_MINUTES = 120
UNIT_TIME_LIMIT_MINUTES = 60
FRQ_TIME_LIMIT_MINUTES = 50

EXAM_MCQ_WEIGHT = 70
EXAM_FRQ_WEIGHT = 30

MCQ_BANK: list[dict] = [
    # ------------------------------------------------ unit 1 (30)
    {
        "unit": 1,
        "question_text": "a hospitality group's annual security review lists four findings. finding 1: the guest wi-fi extends into the conference center, allowing outsiders to attempt connections. finding 2: open network ports in the conference center connect to the internal staff network and could enable an adversary to spoof a legitimate device. finding 3: lobby feedback tablets share a wi-fi network that exposes only nonsensitive customer satisfaction data. finding 4: printer model numbers and firmware versions are visible on the internal network. which finding should be documented as the highest risk?",
        "correct": "open network ports on the internal staff network that could enable device spoofing",
        "wrong": [
            "guest wi-fi coverage extending into the conference center",
            "feedback tablets exposing nonsensitive satisfaction data on a shared network",
            "printer model numbers and firmware versions being visible internally",
        ],
    },
    {
        "unit": 1,
        "question_text": "a district administrator wants the file Oak_Park_HS to have exactly these permissions: the principal kmurray can read and write, the staff group can read, and everyone else has no access. the target listing is -rw-r----- kmurray staff Oak_Park_HS. which command sets these permissions?",
        "correct": "chmod 640 Oak_Park_HS",
        "wrong": [
            "chmod 444 Oak_Park_HS",
            "chmod 740 Oak_Park_HS",
            "chmod 777 Oak_Park_HS",
        ],
    },
    {
        "unit": 1,
        "question_text": "a security manager receives this request: 'access to the transaction system should automatically be allowed only during business hours and only from devices physically connected to the corporate network.' which access control model best matches this request?",
        "correct": "rule-based access control, because access decisions follow configured conditions",
        "wrong": [
            "discretionary access control, because each employee chooses who may access the system",
            "mandatory access control, because labels on objects decide all access",
            "role-based access control, because employees are assigned to job roles",
        ],
    },
    {
        "unit": 1,
        "question_text": "a technician cannot reach a server on port 443 from 192.168.45.37. the server firewall rules, evaluated top to bottom with the first match applying, include: rule 3 'deny inbound tcp 443 from 192.168.0.0-192.168.255.255' and rule 7 'allow inbound tcp 443 from all'. traffic is denied despite the later allow. which single change fixes access while preserving intent?",
        "correct": "swap rule 3 with rule 7 so the allow is evaluated first for this traffic",
        "wrong": [
            "swap rule 1 with rule 10",
            "swap rule 3 with rule 4",
            "swap rule 4 with rule 7",
        ],
    },
    {
        "unit": 1,
        "question_text": "two hashing functions are run on four files. function 1 produces distinct digests for all four files. function 2 produces the identical digest for file1.txt and file3.txt. which statement is supported by the hashes?",
        "correct": "file1.txt and file3.txt produce a collision under function 2",
        "wrong": [
            "file1.txt and file3.txt are exact copies of each other",
            "function 1 is more secure than function 2 because its outputs are longer",
            "function 1 and function 2 are the same algorithm",
        ],
    },
    {
        "unit": 1,
        "question_text": "a hospital is upgrading physical security for rooms holding sensitive medical equipment and patient records. the manager wants an authentication method that is unique to each individual and extremely difficult to duplicate or spoof. which method fits best?",
        "correct": "retina scan",
        "wrong": [
            "access card",
            "password",
            "pin",
        ],
    },
    {
        "unit": 1,
        "question_text": "which statement best describes how offline password attacks work?",
        "correct": "adversaries use automated tools to hash many candidate passwords and compare them to a captured hash",
        "wrong": [
            "adversaries submit user and password combinations to a live authentication portal",
            "adversaries intercept traffic crossing a network and read passwords in transit",
            "adversaries exploit weak access controls to retrieve plaintext passwords from a database",
        ],
    },
    {
        "unit": 1,
        "question_text": "a reported phishing email tells staff: 'confirm your personal information by the end of the day. failure to respond may suspend payroll access.' which sentence identifies how the email applies urgency?",
        "correct": "the deadline and the threat of payroll suspension pressure the recipient to act immediately",
        "wrong": [
            "the email claims to come from a trusted internal department",
            "the email asks the recipient to help keep records accurate",
            "the email requests information that is publicly available",
        ],
    },
    {
        "unit": 1,
        "question_text": "the same phishing email states: 'over 92% of employees have already completed this verification.' which social engineering principle does this claim use?",
        "correct": "consensus, because it applies social pressure by implying most coworkers already acted",
        "wrong": [
            "scarcity, because it implies the opportunity to comply may soon be lost",
            "authority, because it presents the request as coming from those in power",
            "familiarity, because it frames the request as routine hr communication",
        ],
    },
    {
        "unit": 1,
        "question_text": "an employee replies to the phishing email with a phone number, pet's name, and date of birth. what is the most likely impact?",
        "correct": "an adversary could use the personal details to impersonate the employee and answer security questions",
        "wrong": [
            "an adversary could use the reply to plant malware in the mail server",
            "an adversary could gain a foothold on the recipient's device and move laterally",
            "an adversary could disable payroll access for every employee",
        ],
    },
    {
        "unit": 1,
        "question_text": "a server access log contains: 'get ../../../../etc/passwd http/1.1' 403 and 'get ../../../../etc/shadow http/1.1' 403. which application attack do these entries indicate?",
        "correct": "directory traversal attack",
        "wrong": [
            "buffer overflow attack",
            "cross site scripting attack",
            "sql injection attack",
        ],
    },
    {
        "unit": 1,
        "question_text": "an administrator investigates possible unauthorized logins against a grading system. how do authentication logs help determine whether unauthorized attempts occurred?",
        "correct": "they record all login activity, which allows the administrator to reconstruct when and how attempts occurred",
        "wrong": [
            "they record which password was used so ownership can be verified",
            "they record the geographic location of every attempt so foreign regions can be blocked",
            "they record device types so unauthorized devices can be blocked automatically",
        ],
    },
    {
        "unit": 1,
        "question_text": "a facility uses a signature-based network detection system instead of an anomaly-based one. what is a likely consequence of that choice?",
        "correct": "more false negatives against novel attacks that lack known signatures",
        "wrong": [
            "higher operating costs than anomaly-based detection",
            "slower detection time for every category of attack",
            "more alert fatigue because every flow is baselined",
        ],
    },
    {
        "unit": 1,
        "question_text": "an authentication log shows two arp replies ten minutes apart: 192.168.1.13 is-at 00:01:5e:00:fc:16 and later 192.168.1.13 is-at 00:3b:cc:5e:ee:01. which attack does this indicate?",
        "correct": "arp poisoning attack",
        "wrong": [
            "dns poisoning attack",
            "evil-twin attack",
            "mac flooding attack",
        ],
    },
    {
        "unit": 1,
        "question_text": "which statement best describes the output length of a cryptographic hash function?",
        "correct": "the output length is fixed regardless of the length of the input",
        "wrong": [
            "the output is always longer than the input due to the hashing process",
            "the output length varies based on the length of the input",
            "the output is always shorter than the length of the input",
        ],
    },
    {
        "unit": 1,
        "question_text": "a base is classifying physical vulnerabilities by risk. which item is best classified as a moderate risk?",
        "correct": "a locked warehouse holding noncritical computers that could become a foothold to other network resources",
        "wrong": [
            "an unlocked trailer containing non-networked office equipment that cannot reach sensitive systems",
            "a main server room with sensitive systems that lacks sufficiently restricted access",
            "a public touchscreen directory with no sensitive data that is unlikely to be exploited",
        ],
    },
    {
        "unit": 1,
        "question_text": "a bank's security team stopped an intrusion where the loan application form received input containing ' or '1'='1'; --. the administrator called the attacker someone 'copying code from the internet to see if anything works.' which adversary type best fits?",
        "correct": "script kiddie",
        "wrong": [
            "cyberterrorist",
            "state actor",
            "insider",
        ],
    },
    {
        "unit": 1,
        "question_text": "in the same bank incident, which security control would most likely prevent this class of attack in the future?",
        "correct": "input sanitization",
        "wrong": [
            "encryption",
            "stateful firewall",
            "access control list",
        ],
    },
    {
        "unit": 1,
        "question_text": "why did submitting ' or '1'='1'; -- into the loan form risk exposing the customer database?",
        "correct": "user input from a web form fed directly into a database query lets an adversary inject control characters that alter the query",
        "wrong": [
            "user input fed into the server file system lets http requests read sensitive files",
            "user input containing executable scripts runs in other users' browsers",
            "user input larger than designated memory lets the adversary overwrite it",
        ],
    },
    {
        "unit": 1,
        "question_text": "a system only allows logins from devices physically located in the eastern, central, mountain, or pacific time zones. which authentication factor is being used?",
        "correct": "location factor",
        "wrong": [
            "biometric factor",
            "knowledge factor",
            "possession factor",
        ],
    },
    {
        "unit": 1,
        "question_text": "a hospital deployed an automated tool that analyzes traffic, alerts the team about suspicious activity, but never blocks traffic itself. which system is it?",
        "correct": "network intrusion detection system",
        "wrong": [
            "network intrusion prevention system",
            "data loss prevention system",
            "security information and event management system",
        ],
    },
    {
        "unit": 1,
        "question_text": "a cleaning contractor badges into an office after hours, plugs a rogue access point into an ethernet jack, and captures staff traffic from the parking lot. which combination best describes the threat?",
        "correct": "an insider with physical access deploying an evil-twin access point",
        "wrong": [
            "a remote adversary conducting an on-path attack over the internet",
            "a script kiddie running automated vulnerability scans from abroad",
            "an insider exfiltrating data using an authorized cloud backup",
        ],
    },
    {
        "unit": 1,
        "question_text": "an office manager tapes the building wi-fi password to the reception monitor so visitors can ask guests for it. which two social engineering principles does this practice most directly amplify?",
        "correct": "familiarity, because a visible shared secret feels routine and safe",
        "wrong": [
            "intimidation, because visitors fear the receptionist",
            "scarcity, because the password is limited to one copy",
            "consensus, because most guests have already connected",
        ],
    },
    {
        "unit": 1,
        "question_text": "which pairing correctly matches an authentication factor with an example?",
        "correct": "possession factor - a hardware security key that must be physically present",
        "wrong": [
            "knowledge factor - a fingerprint scanned at the door",
            "biometric factor - a six-digit pin typed into a keypad",
            "location factor - a one-time code generated by an app",
        ],
    },
    {
        "unit": 1,
        "question_text": "a startup has no formal policies. employees share one admin password, ex-staff accounts stay enabled, and laptops are unencrypted. which single control, implemented first, reduces the most risk?",
        "correct": "unique named accounts with least-privilege roles and disabled ex-staff access",
        "wrong": [
            "a printed acceptable use policy signed by everyone",
            "full-disk encryption on all laptops",
            "a banner warning unauthorized users at login",
        ],
    },
    {
        "unit": 1,
        "question_text": "a user receives a text from 'the parcel service' with a link to a look-alike site asking for a small 'customs fee' and card details. which best describes the attack and its most direct harm?",
        "correct": "smishing leading to payment card fraud",
        "wrong": [
            "vishing leading to identity theft through a phone call",
            "tailgating leading to physical network access",
            "evil twin leading to traffic interception",
        ],
    },
    {
        "unit": 1,
        "question_text": "risk = likelihood x impact. an unpatched internet-facing vpn has a published exploit, and compromise would expose the entire internal network. how should this be classified and treated?",
        "correct": "high risk; patch immediately as the first priority",
        "wrong": [
            "moderate risk; patch during the next maintenance window",
            "low risk; monitor and revisit next quarter",
            "acceptable risk; document it and move on",
        ],
    },
    {
        "unit": 1,
        "question_text": "which control is primarily a detective control rather than preventive, deterrent, or compensating?",
        "correct": "log review and alerting on failed login clusters",
        "wrong": [
            "requiring mfa for remote access",
            "posting signage that video surveillance is in use",
            "segmenting legacy systems behind an additional firewall",
        ],
    },
    {
        "unit": 1,
        "question_text": "a company requires employees to badge in, then wait for a guard to verify their face against the badge photo before entering the data hall. which factors and control types are combined?",
        "correct": "possession plus biometric factors, combining preventive and detective controls",
        "wrong": [
            "knowledge plus possession factors, combining deterrent and corrective controls",
            "biometric plus location factors, combining corrective and compensating controls",
            "knowledge plus biometric factors, combining preventive and deterrent controls",
        ],
    },
    {
        "unit": 1,
        "question_text": "after a successful phishing simulation failure rate of 30%, leadership wants one control that most reduces successful credential phishing over the next month. which delivers the largest immediate reduction?",
        "correct": "phishing-resistant mfa on all remote-accessible accounts",
        "wrong": [
            "a monthly security awareness newsletter",
            "banning all external email attachments",
            "a stricter password rotation policy",
        ],
    },

    # ------------------------------------------------ unit 2 (30)
    {
        "unit": 2,
        "full_only": True,
        "question_text": "an office building's server room door uses an electronic badge reader, but the strike latch has been propped open with tape for 'airflow.' which combination best describes the situation and the cheapest immediate fix?",
        "correct": "physical control failure; re-close the door and add a monitored door alarm",
        "wrong": [
            "technical control failure; replace the badge reader firmware",
            "administrative control failure; rewrite the badge policy only",
            "deterrent control failure; add warning signage at the entrance",
        ],
    },
    {
        "unit": 2,
        "full_only": True,
        "question_text": "a campus wants visitors escorted at all times inside labs, but logging shows visitor badges active for six hours in a lab with no escort check-in. what does this indicate and what should close the gap?",
        "correct": "an administrative control gap between policy and enforcement; require escort check-in at the lab door",
        "wrong": [
            "a preventive control working as designed; no action is needed",
            "a technical failure of the badge reader; replace the readers",
            "a detective control succeeding; the logs prove compliance",
        ],
    },
    {
        "unit": 2,
        "full_only": True,
        "question_text": "during a fire, the electronic door locks fail closed and staff cannot evacuate quickly. which term best describes the correct design change?",
        "correct": "fail-safe defaults with emergency egress override",
        "wrong": [
            "defense in depth with extra locks",
            "least privilege applied to doors",
            "separation of duties for door control",
        ],
    },
    {
        "unit": 2,
        "question_text": "a small office's acceptable use policy says users may not connect removable media without authorization, may not alter security settings, and must keep software updated. which single rule most directly reduces malware entry through physical channels?",
        "correct": "the removable media restriction",
        "wrong": [
            "the software update requirement",
            "the prohibition on altering security settings",
            "none of the rules address physical malware channels",
        ],
    },
    {
        "unit": 2,
        "question_text": "a receptionist is socially engineered into plugging a 'lost usb drive found in the parking lot' into a front-desk computer. which control combination best stops both the plug-in and the follow-on execution?",
        "correct": "usb port blocking plus application allowlisting",
        "wrong": [
            "strong passwords plus screen lock timers",
            "a firewall plus web filtering",
            "full-disk encryption plus antivirus",
        ],
    },
    {
        "unit": 2,
        "question_text": "an audit finds the badge system grants all staff 24/7 access to every room. which principle is most violated and what is the fix?",
        "correct": "least privilege; grant time-bound access scoped to each role's needed rooms",
        "wrong": [
            "separation of duties; require two approvers for badge changes",
            "defense in depth; add a second badge reader at each door",
            "fail-safe defaults; make all doors fail closed",
        ],
    },
    {
        "unit": 2,
        "full_only": True,
        "question_text": "a shared lobby kiosk must let visitors view a directory but nothing else. which configuration best enforces this?",
        "correct": "a locked-down kiosk account with an allowlisted browser and no usb ports",
        "wrong": [
            "a standard user account with antivirus installed",
            "an administrator account with a screen lock timer",
            "a guest account with firewall disabled for speed",
        ],
    },
    {
        "unit": 2,
        "question_text": "cctv footage is overwritten after 72 hours, but investigations often begin on day five. what is the correct classification of this gap and the remedy?",
        "correct": "a detective control weakness; extend retention to meet investigation needs",
        "wrong": [
            "a preventive control strength; shorter retention saves storage",
            "a corrective control; retrain the camera operator",
            "a compensating control; add more cameras",
        ],
    },
    {
        "unit": 2,
        "full_only": True,
        "question_text": "a warehouse's loading dock lets delivery drivers in with a code shared among 40 people. which change most improves accountability without slowing deliveries?",
        "correct": "unique per-person codes with logging and prompt revocation",
        "wrong": [
            "rotating the shared code weekly",
            "adding a second shared code for supervisors",
            "posting the code on a sign inside the dock",
        ],
    },
    {
        "unit": 2,
        "question_text": "a policy prohibits personal hotspots in the office, but the guest wi-fi is down and several employees enable hotspots to work. what best describes this situation?",
        "correct": "a policy enforcement gap creating an unmonitored network path; provide a working alternative and enforce the rule",
        "wrong": [
            "compliant behavior, since hotspots are more secure than the guest network",
            "a technical failure of the hotspots themselves",
            "an acceptable workaround documented after the fact",
        ],
    },
    {
        "unit": 2,
        "question_text": "an office manager asks why the clean-desk policy matters. which rationale is strongest?",
        "correct": "it reduces opportunities for unauthorized people to read, copy, or steal sensitive information left unattended",
        "wrong": [
            "it makes offices look more organized for inspections",
            "it reduces the number of printers needed",
            "it speeds up janitorial work after hours",
        ],
    },
    {
        "unit": 2,
        "full_only": True,
        "question_text": "a building's hvac maintenance vendor needs one-time access to a mechanical room. which approach best applies least privilege?",
        "correct": "a single-use badge code valid only for that room and time window",
        "wrong": [
            "a permanent vendor badge with building-wide access",
            "sharing the front desk code for the day",
            "propping the mechanical room door open during the visit",
        ],
    },
    {
        "unit": 2,
        "question_text": "a branch office keeps its network rack unlocked because 'the room is inside a locked suite.' which concept does this ignore?",
        "correct": "defense in depth",
        "wrong": [
            "single sign-on",
            "data minimization",
            "secure defaults in software",
        ],
    },
    {
        "unit": 2,
        "full_only": True,
        "question_text": "after hours, motion sensors should trigger camera recording and alert a guard. the sensors work but the alert integration silently failed two months ago. what does this illustrate?",
        "correct": "a detective control chain that broke silently; validate alert paths with periodic tests",
        "wrong": [
            "a preventive control working correctly",
            "a deterrent control that scared off intruders",
            "a corrective control that fixed itself",
        ],
    },
    {
        "unit": 2,
        "question_text": "a school computer lab's door propping problem persists despite signs. which control type is most likely to actually change behavior?",
        "correct": "a door alarm tied to staff notification",
        "wrong": [
            "more signage with larger fonts",
            "a policy re-announcement in email",
            "asking students nicely in assembly",
        ],
    },
    {
        "unit": 2,
        "full_only": True,
        "question_text": "an organization stores backup tapes in a fireproof safe next to the servers. which risk does this still leave?",
        "correct": "a single physical event such as fire, flood, or theft can destroy or capture both originals and backups",
        "wrong": [
            "tapes degrade faster inside safes than on shelves",
            "the safe's combination is likely written down nearby",
            "tapes cannot be encrypted, so this is already the weakest option",
        ],
    },
    {
        "unit": 2,
        "question_text": "a visitor signs in and receives a badge, but the logbook with visitor names is visible to everyone at the desk. what is the best classification and fix?",
        "correct": "an information disclosure issue; move the logbook out of public view",
        "wrong": [
            "a physical entry failure; stop issuing badges",
            "a network issue; segment the front desk vlan",
            "an encryption issue; encrypt the logbook",
        ],
    },
    {
        "unit": 2,
        "full_only": True,
        "question_text": "which control most directly deters tailgating at a busy single-door entrance without slowing throughput much?",
        "correct": "a turnstile or mantrap at the entrance",
        "wrong": [
            "a sign that says do not tailgate",
            "monthly reminders from hr",
            "cameras positioned inside the lobby",
        ],
    },
    {
        "unit": 2,
        "question_text": "an office's wi-fi shares one psk across staff and guests. guests periodically receive prompts to trust a new certificate they have never seen. what should be concluded and done?",
        "correct": "the shared psk plus prompts suggests a possible evil twin; move guests to a separate segmented guest network and investigate",
        "wrong": [
            "the certificate prompt is routine maintenance; click accept to restore access",
            "psk rotation is due; post the new psk at reception",
            "guests' devices are misconfigured; have each guest reinstall drivers",
        ],
    },
    {
        "unit": 2,
        "full_only": True,
        "question_text": "a retrofit adds card readers to server room doors but leaves ceiling tiles accessible from the neighboring office. what does this show about physical security design?",
        "correct": "controls must consider all entry paths, not just the obvious door",
        "wrong": [
            "card readers are incompatible with older buildings",
            "ceiling tiles are irrelevant to physical security",
            "the card readers should be replaced with keypads",
        ],
    },
    {
        "unit": 2,
        "question_text": "a nonprofit can afford either cameras or access control badges, not both. for protecting a small server closet, which single choice is the stronger preventive control?",
        "correct": "access control badges on the closet door",
        "wrong": [
            "cameras covering the hallway",
            "cameras inside the closet",
            "a sign stating the area is monitored",
        ],
    },
    {
        "unit": 2,
        "full_only": True,
        "question_text": "during an incident, the team cannot determine who was in the building because badges are shared. what root cause and fix apply?",
        "correct": "shared credentials destroyed accountability; issue unique badges and prohibit sharing",
        "wrong": [
            "cameras were too expensive; buy more cameras",
            "the badge system was offline; upgrade firmware",
            "the incident response plan lacked a phone tree",
        ],
    },
    {
        "unit": 2,
        "question_text": "a policy requires two people to open the crypto vault. one person's badge also works alone due to a wiring fault. which principle failed and how is it restored?",
        "correct": "separation of duties; repair the fault and audit dual-control logs",
        "wrong": [
            "least privilege; give the vault badge to fewer people",
            "defense in depth; add a third badge reader",
            "need to know; restrict who knows the vault's purpose",
        ],
    },
    {
        "unit": 2,
        "full_only": True,
        "question_text": "an organization's clean desk policy forbids sticky notes with passwords, yet a walkthrough finds several under keyboards. what is the most effective next step?",
        "correct": "provide a password manager so staff do not need written passwords",
        "wrong": [
            "email everyone a reminder about the policy",
            "install cameras over every desk",
            "increase password rotation to every 30 days",
        ],
    },
    {
        "unit": 2,
        "question_text": "a small clinic's front door stays unlocked during business hours, but the records room behind it has a keypad with a code known to all staff, including recent volunteers. what is the highest-priority fix?",
        "correct": "revoke and reissue unique keypad codes, limiting to current staff who need records access",
        "wrong": [
            "lock the front door during business hours",
            "add a sign prohibiting unauthorized entry",
            "install a camera facing the records room door",
        ],
    },
    {
        "unit": 2,
        "full_only": True,
        "question_text": "which scenario best exemplifies a compensating control for a server room whose ceiling cannot be hardened?",
        "correct": "a monitored vibration sensor in the ceiling space plus rapid response",
        "wrong": [
            "a stronger lock on the server room door",
            "a sign in the neighboring office forbidding ceiling access",
            "moving the servers to a second-floor room",
        ],
    },
    {
        "unit": 2,
        "question_text": "an office uses smart lights that an employee connects to the corporate network for personal convenience. the lights receive no security updates. what is the correct classification of this risk and the best response?",
        "correct": "an unmanaged iot device on the internal network; move it to a segmented guest or iot network or remove it",
        "wrong": [
            "an acceptable productivity tool; leave it on the corporate network",
            "a critical vulnerability in the corporate firewall; replace the firewall",
            "an insider threat; discipline the employee",
        ],
    },
    {
        "unit": 2,
        "full_only": True,
        "question_text": "a site's emergency plan says to shut down servers before evacuating. during a drill, staff spend eight minutes hunting for shutdown steps. what is the gap and remedy?",
        "correct": "an administrative control that is untested in practice; post runbooks and re-drill until the timeline is met",
        "wrong": [
            "a technical failure; servers should auto-shutdown on fire alarm",
            "a deterrence failure; the drill scared nobody",
            "an encryption failure; data was left unencrypted",
        ],
    },
    {
        "unit": 2,
        "question_text": "a delivery driver follows an employee through the badge-controlled side door carrying a package for 'the server room.' the employee holds the door. what is this called and what best prevents it?",
        "correct": "tailgating; trained staff should politely redirect couriers to the approved receiving process",
        "wrong": [
            "shoulder surfing; add privacy filters to monitors",
            "dumpster diving; lock the trash area",
            "vishing; verify the caller's identity",
        ],
    },
    {
        "unit": 2,
        "full_only": True,
        "question_text": "a risk register lists an unlocked network closet as moderate risk because it is inside a locked suite. an assessor finds the suite door is also propped open. what should the assessor conclude?",
        "correct": "the assumed control no longer holds, so the closet's risk is now high",
        "wrong": [
            "the closet's risk remains moderate because the suite still has cameras",
            "the assessment was wrong; an unlocked closet is always low risk",
            "the finding is compensating and needs no action",
        ],
    },

    # ------------------------------------------------ unit 3 (30)
    {
        "unit": 3,
        "question_text": "an nginx access log shows one external ip running: 'get ../../../../etc/passwd', 'get ../../../../etc/shadow', then 'get ../../../var/www/html/config.php.bak'. all return 400/403/404. which statement is the most complete assessment?",
        "correct": "the client performed automated directory traversal and backup-file probing; both were blocked, but the pattern warrants blocking the source and reviewing exposed files",
        "wrong": [
            "the server was compromised because config.php.bak returned 404",
            "the traffic is benign crawling behavior and needs no action",
            "the logs prove a sql injection attempt that failed",
        ],
    },
    {
        "unit": 3,
        "question_text": "a firewall's final rule is 'deny inbound all all all.' an admin adds an allow rule for port 5900 at the bottom, below the deny. what happens and why?",
        "correct": "connections still fail because rules are evaluated top-down and the deny matches first",
        "wrong": [
            "connections succeed because allow rules override deny rules",
            "the firewall rejects the configuration as contradictory",
            "vnc traffic is logged but neither allowed nor denied",
        ],
    },
    {
        "unit": 3,
        "question_text": "a dmz web server must accept https from the internet, reach an internal database on 3306 only, and never initiate outbound traffic elsewhere. which rule set best expresses this?",
        "correct": "inbound 443 to the web server; web server to db 3306 only; explicit deny for other outbound",
        "wrong": [
            "inbound any to the web server; any outbound allowed for patching",
            "inbound 80 and 443 to the db; web server unrestricted",
            "no rules; rely on host antivirus on the web server",
        ],
    },
    {
        "unit": 3,
        "question_text": "an ids flags hourly sftp uploads of 2 gb from a backup server to a vendor. investigation confirms a legitimate contract. what is the correct next step?",
        "correct": "tune the rule with an approved exception so alerts focus on genuinely anomalous flows",
        "wrong": [
            "block the vendor ip immediately",
            "disable the ids because it is noisy",
            "report the vendor to authorities",
        ],
    },
    {
        "unit": 3,
        "question_text": "a router acl permits 'tcp 22 from any' to a jump host, and 'tcp 22 from the admin vlan' to all other servers. a pentester from the guest vlan reaches a database server on port 22. what most likely happened?",
        "correct": "the guest vlan traffic was permitted by an overly broad rule or the acl was applied on the wrong interface direction",
        "wrong": [
            "the pentester cracked the database server's ssh password",
            "ssh encryption failed to authenticate the server",
            "the jump host forwarded the pentester's session legitimately",
        ],
    },
    {
        "unit": 3,
        "question_text": "which placement of a network ids sensor gives the broadest visibility into east-west traffic inside a segmented network?",
        "correct": "a span port on the core/distribution switch carrying inter-vlan traffic",
        "wrong": [
            "a sensor on the internet edge firewall only",
            "a sensor on each workstation's loopback",
            "a sensor outside the firewall in the isp handoff",
        ],
    },
    {
        "unit": 3,
        "question_text": "an admin sees '[ufw block] in=eth0 src=203.0.113.25 dst=192.168.1.10 proto=tcp port=25 syn' repeatedly. what does this line indicate?",
        "correct": "the firewall blocked an inbound smtp connection attempt from that source",
        "wrong": [
            "the host successfully sent mail to 203.0.113.25",
            "a dns lookup for the source failed",
            "the kernel dropped an outbound connection to port 25",
        ],
    },
    {
        "unit": 3,
        "question_text": "which statement about ids versus ips placement is correct?",
        "correct": "an ips sits inline and can block traffic in real time; an ids observes a copy and alerts",
        "wrong": [
            "an ids sits inline and blocks; an ips watches a mirror port",
            "both sit inline; they differ only in logging format",
            "both are passive; blocking requires the firewall team",
        ],
    },
    {
        "unit": 3,
        "question_text": "a network segment hosts legacy iot sensors that cannot run agents or tls 1.2. which compensating control best protects them?",
        "correct": "a dedicated vlan with strict firewall allowlists to required destinations only",
        "wrong": [
            "moving them onto the general user network for simplicity",
            "giving them static public ips for monitoring",
            "disabling logging to reduce noise on the segment",
        ],
    },
    {
        "unit": 3,
        "question_text": "a small business wants remote access for five staff to one file server. which design is most appropriate?",
        "correct": "vpn with mfa into the network, then access the file server internally",
        "wrong": [
            "port-forward rdp 3389 directly to the file server from the internet",
            "port-forward smb 445 with a strong password",
            "publish the file server on a public ip with https",
        ],
    },
    {
        "unit": 3,
        "full_only": True,
        "question_text": "an analyst notices periodic dns queries for long random subdomains from one host, e.g. a1b2c4.badguy.example. no legitimate app uses that domain. what is the most likely explanation?",
        "correct": "dns tunneling used for command and control or data exfiltration",
        "wrong": [
            "a misconfigured ntp client polling for time",
            "normal cdn prefetching by the browser",
            "an arp poisoning attempt on the gateway",
        ],
    },
    {
        "unit": 3,
        "question_text": "a site-to-site vpn between offices drops whenever one side's isp changes its ip. which fix is most robust?",
        "correct": "use authenticated dynamic dns or a static ip so the vpn peer definition stays valid",
        "wrong": [
            "lower the vpn's encryption strength to renegotiate faster",
            "increase the tunnel's idle timeout",
            "switch the vpn to ports 80 and 443 only",
        ],
    },
    {
        "unit": 3,
        "question_text": "which ipv4 private range is correctly paired with its cidr block?",
        "correct": "172.16.0.0 - 172.31.255.255 - 172.16.0.0/12",
        "wrong": [
            "10.0.0.0 - 10.255.255.255 - 10.0.0.0/8 only within /16 subnets",
            "192.168.0.0 - 192.168.255.255 - 192.168.0.0/16 as a single /24",
            "169.254.0.0 - 169.254.255.255 - 169.254.0.0/16 as a private lan range",
        ],
    },
    {
        "unit": 3,
        "question_text": "a honeypot on the dmz is probed within minutes of deployment. what is the safest interpretation and action?",
        "correct": "automated internet scanning is constant; keep the honeypot isolated so it cannot pivot",
        "wrong": [
            "the organization is specifically targeted; disconnect the internet",
            "the honeypot failed; delete it and ignore scans",
            "the isp is attacking the network; escalate to law enforcement",
        ],
    },
    {
        "unit": 3,
        "full_only": True,
        "question_text": "an admin wants ssh open to admins only. which rule ordering and scope best achieves this on a top-down firewall?",
        "correct": "allow tcp 22 from the admin subnet, then deny tcp 22 from any, later final default deny",
        "wrong": [
            "deny tcp 22 from any, then allow tcp 22 from the admin subnet",
            "allow tcp 22 from any, then deny tcp 22 from the admin subnet",
            "a single allow tcp 22 from any with logging",
        ],
    },
    {
        "unit": 3,
        "question_text": "an anomaly-based ids is deployed on a network that just migrated to new applications. for the first two weeks, alerts flood the team. what is the best response?",
        "correct": "tune baselines during the learning period and triage by risk so real attacks are not drowned out",
        "wrong": [
            "disable anomaly mode permanently; signatures alone are superior",
            "ignore alerts for a month; the system will fix itself",
            "quarantine every host that generated an alert",
        ],
    },
    {
        "unit": 3,
        "question_text": "which log line most strongly indicates reconnaissance rather than exploitation?",
        "correct": "a single syn scan sweeping hundreds of distinct ports from one external ip with no successful sessions",
        "wrong": [
            "a successful login followed by new user creation",
            "a database query containing ' or '1'='1' that returned 200",
            "an inbound file upload later executed on the server",
        ],
    },
    {
        "unit": 3,
        "question_text": "a nat device logs many outbound connections from one host to distinct external ips on port 445 within a minute. what is the most likely classification?",
        "correct": "smb-based worm propagation or scanning from the host",
        "wrong": [
            "legitimate windows update traffic to a cdn",
            "a printer broadcasting to discover servers",
            "dns resolution of many distinct domains",
        ],
    },
    {
        "unit": 3,
        "full_only": True,
        "question_text": "which change most improves a home router's security posture with the least effort?",
        "correct": "change default admin credentials, disable remote administration, and apply firmware updates",
        "wrong": [
            "enable wps for easier device pairing",
            "disable the firewall to improve gaming latency",
            "set the admin password to the network name for memorability",
        ],
    },
    {
        "unit": 3,
        "question_text": "a packet capture shows tls handshakes succeeding to an unknown ip on 443 from a database server, then steady 5-minute encrypted uploads. what should the analyst suspect and verify first?",
        "correct": "possible exfiltration over tls; verify destination reputation and whether the db server has any business contacting it",
        "wrong": [
            "normal certificate rotation; ignore if the handshake succeeds",
            "a failing nic retransmitting packets",
            "an ntp sync running over tls",
        ],
    },
    {
        "unit": 3,
        "question_text": "which design principle does placing a public web server in a dmz, with rules allowing it to reach only the db tier, best demonstrate?",
        "correct": "segmentation limiting what a compromised host can reach",
        "wrong": [
            "single sign-on for administrative convenience",
            "data minimization for privacy compliance",
            "symmetric encryption for performance",
        ],
    },
    {
        "unit": 3,
        "full_only": True,
        "question_text": "a firewall administrator sees daily blocked syn floods to port 22 from rotating sources, plus one accepted login from an unknown country. which finding deserves the highest priority?",
        "correct": "the accepted login from the unknown country",
        "wrong": [
            "the volume of blocked syn floods to port 22",
            "the rotation of source addresses in the scans",
            "the presence of ssh on a nonstandard port",
        ],
    },
    {
        "unit": 3,
        "question_text": "a network engineer proposes disabling all icmp at the edge 'to be stealthy.' what is the most balanced assessment?",
        "correct": "dropping all icmp breaks diagnostics and pmtu; selectively allow needed icmp types instead",
        "wrong": [
            "correct; icmp serves no legitimate function",
            "correct; icmp is only used by attackers",
            "incorrect; icmp must be fully allowed inbound and outbound everywhere",
        ],
    },
    {
        "unit": 3,
        "question_text": "an ids rule fires on any outbound packet containing the string 'password'. what outcome is most likely at scale?",
        "correct": "high false positives from ordinary traffic; the rule needs tuning and context",
        "wrong": [
            "perfect detection with no operational impact",
            "high false negatives because attackers encrypt payloads",
            "automatic blocking of every matching host",
        ],
    },
    {
        "unit": 3,
        "question_text": "a small office's isp modem provides nat but no firewall logging. the owner wants visibility into blocked inbound attempts. which addition best provides it with minimal cost?",
        "correct": "a software firewall on the server with logging enabled, plus periodic log review",
        "wrong": [
            "a second isp for redundancy",
            "disabling nat to see true source addresses",
            "moving servers to the modem's dmz to reduce noise",
        ],
    },
    {
        "unit": 3,
        "full_only": True,
        "question_text": "which pairing of attack and network indicator is most accurate?",
        "correct": "arp poisoning - duplicate ip-to-mac mappings appearing for one ip",
        "wrong": [
            "arp poisoning - a surge in dns nxdomain responses",
            "dns poisoning - repeated tcp syn packets to port 22",
            "mac flooding - http 403 responses for ../ paths",
        ],
    },
    {
        "unit": 3,
        "question_text": "a university lab needs students to reach the internet but never the administration vlan. the simplest durable control is:",
        "correct": "an acl on the lab vlan denying rfc1918 admin subnets while allowing internet egress",
        "wrong": [
            "teaching students not to browse admin systems",
            "installing host firewalls on every lab machine only",
            "putting lab and admin hosts on one flat vlan",
        ],
    },
    {
        "unit": 3,
        "question_text": "during an incident, the team wants a packet-level record of what the attacker did on the wire, after the fact. why is this usually impossible without prior planning?",
        "correct": "full packet capture is not retained by default; it must be configured and sized in advance",
        "wrong": [
            "packets are encrypted and can never be stored",
            "routers strip payloads from all packets they forward",
            "pcap files expire after 24 hours by internet standard",
        ],
    },
    {
        "unit": 3,
        "full_only": True,
        "question_text": "an idps reports ' Possible ssh brute force' from a source that later authenticated successfully with a valid user. which response sequence is best?",
        "correct": "treat as a possible compromise; validate the user's activity, reset credentials, and review what the session did",
        "wrong": [
            "ignore it; valid authentication proves the user is legitimate",
            "block the user permanently without review",
            "disable ssh on the server to end the alerts",
        ],
    },
    {
        "unit": 3,
        "question_text": "which subnetting choice best separates a guest wi-fi from corporate resources on one router?",
        "correct": "a distinct vlan and subnet for guests with inter-vlan routing denied except to the internet",
        "wrong": [
            "the same subnet with different psks for guests and staff",
            "guests on the server subnet for faster streaming",
            "guests bridged onto the admin vlan with mac filtering",
        ],
    },

    # ------------------------------------------------ unit 4 (30)
    {
        "unit": 4,
        "question_text": "an ls -l shows public_data.csv with permissions -rw-rw-rw-. which statement is the most complete risk assessment?",
        "correct": "any local user can read and modify the file, so integrity and confidentiality depend entirely on the directory's placement",
        "wrong": [
            "only the owner can write, so integrity is protected",
            "the group can execute the file, which is the primary risk",
            "the file is unreadable by others, so it is safe",
        ],
    },
    {
        "unit": 4,
        "question_text": "a junior admin runs 'chmod 777 /srv/app' to 'fix' an app error. what is the best correction and rationale?",
        "correct": "restore least privilege, e.g. 640 owned by the service user, and fix the app's actual permission error",
        "wrong": [
            "leave 777; permissions rarely cause app errors",
            "set 666 so the app can read but not execute",
            "switch ownership to root and keep 777",
        ],
    },
    {
        "unit": 4,
        "question_text": "an incident response plan must preserve evidence on a running laptop. which first step best balances evidence and safety?",
        "correct": "capture volatile memory, then isolate the device from networks without powering it off",
        "wrong": [
            "power off immediately to stop the attacker",
            "log in and delete suspicious files",
            "run a full antivirus scan and reboot",
        ],
    },
    {
        "unit": 4,
        "question_text": "a laptop with full-disk encryption is stolen while suspended, not powered off. why does suspension weaken the protection?",
        "correct": "ram retains keys in suspension, so an adversary with tools may extract them",
        "wrong": [
            "full-disk encryption is disabled while suspended",
            "suspension uploads the key to the vendor",
            "suspension formats the swap partition",
        ],
    },
    {
        "unit": 4,
        "question_text": "an org wants to block unknown usb mass storage but allow approved encrypted sticks by serial. which control best fits?",
        "correct": "device control policy allowlisting by hardware id with all others blocked",
        "wrong": [
            "disabling all usb ports including keyboards",
            "antivirus scans only, with ports open",
            "a group policy that hides file explorer",
        ],
    },
    {
        "unit": 4,
        "question_text": "an mdm reports a phone is jailbroken and holds corporate email. what is the standard response?",
        "correct": "block the device from corporate resources and require re-enrollment on a compliant device",
        "wrong": [
            "allow it but increase password length",
            "ignore the jailbreak since email is encrypted",
            "wipe only the photos app",
        ],
    },
    {
        "unit": 4,
        "full_only": True,
        "question_text": "a fleet of kiosks runs a single app. which combination most reduces their attack surface?",
        "correct": "kiosk mode with application allowlisting, auto-updates, and usb ports disabled",
        "wrong": [
            "standard desktop with antivirus and admin rights",
            "full desktop with a screensaver password",
            "admin rights with a strict acceptable use policy",
        ],
    },
    {
        "unit": 4,
        "question_text": "a server's auth log shows 'failed password for invalid user admin from 203.0.113.25' repeated across many usernames, then 'accepted password for jprice from 192.168.1.50'. what is the correct reading?",
        "correct": "the external source conducted a brute force or dictionary attack; the accepted login is from an internal address and needs separate validation",
        "wrong": [
            "jprice's account was definitely compromised by 203.0.113.25",
            "the failed logins are routine and can be ignored",
            "the accepted login proves the brute force succeeded",
        ],
    },
    {
        "unit": 4,
        "question_text": "which ssh hardening change most directly stops password brute force?",
        "correct": "disable password authentication and require keys",
        "wrong": [
            "change the ssh banner text",
            "move ssh to port 2222 only",
            "enable root login with a strong password",
        ],
    },
    {
        "unit": 4,
        "full_only": True,
        "question_text": "a workstation's process list shows powershell spawning from a word document with encoded commands. what is this most consistent with?",
        "correct": "a malicious macro-driven downloader stage",
        "wrong": [
            "routine office update activity",
            "a printer driver installation",
            "normal user profile loading",
        ],
    },
    {
        "unit": 4,
        "question_text": "a data center's out-of-band management interface (ipmi) is reachable from the user vlan with default credentials on one node. what is the correct severity and fix?",
        "correct": "critical; place management on a dedicated vlan, change credentials, and restrict access to admin hosts",
        "wrong": [
            "low; default credentials are acceptable on internal management",
            "medium; leave it reachable but add a stronger password",
            "informational; ipmi cannot be used to attack hosts",
        ],
    },
    {
        "unit": 4,
        "question_text": "an endpoint team wants to detect lateral movement via wmi and psexec. which telemetry is most useful?",
        "correct": "process creation with parent-child relationships plus network logon events",
        "wrong": [
            "web proxy logs only",
            "dns query logs only",
            "badge swipe records",
        ],
    },
    {
        "unit": 4,
        "question_text": "a user reports their cursor moving on its own and files appearing. the machine is on the corporate lan with rdp 3389 open to all internal hosts. what is the most likely explanation and immediate action?",
        "correct": "a live interactive rdp session by another party; disconnect the session, disable rdp or restrict it, and investigate",
        "wrong": [
            "a hardware mouse fault; replace the mouse",
            "a scheduled task moving files; disable task scheduler",
            "a display driver glitch; reinstall drivers",
        ],
    },
    {
        "unit": 4,
        "full_only": True,
        "question_text": "which file permission for /etc/shadow best follows least privilege on a standard linux host?",
        "correct": "640 owned by root with a shadow group, or equivalent restrictive mode",
        "wrong": [
            "644 world-readable for compatibility",
            "666 so account tools work anywhere",
            "755 to allow directory traversal by all",
        ],
    },
    {
        "unit": 4,
        "question_text": "a pentester with physical access boots a machine from usb and reads the disk. which control would have prevented the read?",
        "correct": "full-disk encryption with a pre-boot password and disabled external boot",
        "wrong": [
            "a bios splash logo",
            "a strong windows login password only",
            "a screen lock after 15 minutes",
        ],
    },
    {
        "unit": 4,
        "question_text": "an org's patch window is monthly, but a critical vulnerability with public exploit affects an internet-facing service. what is the correct action?",
        "correct": "apply an emergency out-of-band patch now, with rollback tested",
        "wrong": [
            "wait for the monthly window per policy",
            "document the risk and skip patching",
            "block the service's ports until next quarter",
        ],
    },
    {
        "unit": 4,
        "full_only": True,
        "question_text": "which log source would most directly show that a usb storage device was mounted on a linux workstation?",
        "correct": "kernel logs showing sd device detection and mount events",
        "wrong": [
            "nginx access logs",
            "cron logs",
            "sudo command history only",
        ],
    },
    {
        "unit": 4,
        "question_text": "a hospital device running an obsolete os cannot be patched and is networked. which compensating control set is most appropriate?",
        "correct": "isolate it on a dedicated vlan with strict allowlist rules and monitoring for anomalous traffic",
        "wrong": [
            "place it on the guest network for convenience",
            "give it a public ip for remote vendor support",
            "disable logging to improve its performance",
        ],
    },
    {
        "unit": 4,
        "question_text": "an admin account shows a new ssh key added to authorized_keys from an unfamiliar session. what does this most likely indicate and what should be done first?",
        "correct": "persistence by an adversary; remove the key, rotate credentials, and investigate the source session",
        "wrong": [
            "routine key rotation by the admin; ignore",
            "a sshd misconfiguration; restart the service",
            "a patch adding a vendor key; accept it",
        ],
    },
    {
        "unit": 4,
        "full_only": True,
        "question_text": "which distinction between ids and antivirus is most accurate?",
        "correct": "ids inspects network traffic patterns; antivirus inspects files and processes on a host",
        "wrong": [
            "ids works only offline; antivirus works only live",
            "ids replaces the need for host hardening",
            "antivirus blocks network attacks at the switch",
        ],
    },
    {
        "unit": 4,
        "question_text": "a mobile device is lost. which pre-configured capability most reduces data exposure?",
        "correct": "enforced device encryption with remote wipe",
        "wrong": [
            "a strong camera shutter sound",
            "a custom home screen wallpaper",
            "a distinctive phone case",
        ],
    },
    {
        "unit": 4,
        "question_text": "an analyst sees 'accepted publickey for deploy from 10.0.0.9' followed by new cron entries and outbound tls to an unknown host. what is the best classification of the sequence?",
        "correct": "indicators of post-compromise activity including persistence and possible exfiltration",
        "wrong": [
            "routine deployment automation",
            "a failed login attempt only",
            "a benign software update",
        ],
    },
    {
        "unit": 4,
        "full_only": True,
        "question_text": "a security baseline requires local admin rights be removed from user laptops. which likely impact must be planned for?",
        "correct": "increased it tickets for software installs, mitigated by a self-service approved catalog",
        "wrong": [
            "instant malware elimination with no downsides",
            "improved battery life",
            "loss of disk encryption capability",
        ],
    },
    {
        "unit": 4,
        "question_text": "a root cause analysis shows an attacker moved from a user laptop to a server using reused local admin credentials. which single change best breaks that chain?",
        "correct": "unique local admin credentials per host or credentialed access only via pam",
        "wrong": [
            "a longer domain password policy",
            "weekly antivirus scans on servers",
            "a new firewall at the network edge",
        ],
    },
    {
        "unit": 4,
        "question_text": "which statement about full-disk encryption is correct?",
        "correct": "it protects data at rest when the device is off, but not against an adversary with a decrypted running session",
        "wrong": [
            "it protects data in transit across networks",
            "it replaces the need for backups",
            "it prevents malware from executing",
        ],
    },
    {
        "unit": 4,
        "full_only": True,
        "question_text": "a company allows personal laptops byod. which minimum control set best balances risk and practicality?",
        "correct": "mdm enrollment, disk encryption, patched os, and conditional access to corporate apps",
        "wrong": [
            "no controls; trust users because they signed a policy",
            "issuing domain admin accounts to power users",
            "requiring laptops to join the domain with local admin rights",
        ],
    },
    {
        "unit": 4,
        "question_text": "an edr console shows one host attempting smb connections to every other host in its /24 within seconds. what is the most appropriate immediate action?",
        "correct": "isolate the host at the switch or edr level, then investigate",
        "wrong": [
            "reboot the network core",
            "add a firewall rule allowing the traffic",
            "disable the edr agent to test",
        ],
    },
    {
        "unit": 4,
        "question_text": "which pairing of hardening step and threat mitigated is correct?",
        "correct": "disabling usb boot - attackers booting external media to bypass the os",
        "wrong": [
            "disabling usb boot - phishing emails with macro attachments",
            "screen lock timeout - remote exploit of a web service",
            "host firewall - lost device data exposure while powered off",
        ],
    },
    {
        "unit": 4,
        "full_only": True,
        "question_text": "a linux server's cron runs a script from /tmp nightly. what does this strongly suggest and what is the first step?",
        "correct": "malware persistence; capture the script for analysis before removal",
        "wrong": [
            "a vendor update; leave it running",
            "harmless log rotation; delete cron entirely",
            "a failed backup; restore from tape",
        ],
    },
    {
        "unit": 4,
        "question_text": "an org images laptops with local admin disabled, edr installed, disk encryption enforced, and usb storage blocked. which residual risk remains most significant?",
        "correct": "phishing leading to credential compromise of a standard user session",
        "wrong": [
            "usb-borne malware infecting the fleet",
            "offline disk extraction from stolen laptops",
            "unauthorized software installs by users",
        ],
    },

    # ------------------------------------------------ unit 5 (30)
    {
        "unit": 5,
        "question_text": "a login form builds queries by string concatenation: 'select * from users where name = \"' + input + '\"'. which fix most directly removes the sql injection risk?",
        "correct": "parameterized queries that treat input as data, never as sql text",
        "wrong": [
            "a web application firewall in front of the site",
            "hiding the form behind https",
            "longer password requirements on the form",
        ],
    },
    {
        "unit": 5,
        "question_text": "a bank's article says the attacker submitted ' or '1'='1'; -- through a loan form. which vulnerability class and which best-practice control does this map to?",
        "correct": "sql injection; input sanitization and parameterized queries",
        "wrong": [
            "xss; output encoding",
            "csrf; anti-forgery tokens",
            "idor; object-level authorization",
        ],
    },
    {
        "unit": 5,
        "question_text": "a web app displays user comments verbatim. an attacker posts a comment containing script that runs in every viewer's browser. which vulnerability and fix apply?",
        "correct": "stored xss; encode output and apply a strict content security policy",
        "wrong": [
            "sql injection; parameterized queries",
            "csrf; same-site cookies",
            "ssrf; egress filtering",
        ],
    },
    {
        "unit": 5,
        "question_text": "why does a strict content security policy reduce xss impact even when output encoding is missed?",
        "correct": "it restricts which scripts may execute and from where, limiting what injected code can load or run",
        "wrong": [
            "it encrypts the page content end to end",
            "it patches the browser automatically",
            "it removes the need for authentication",
        ],
    },
    {
        "unit": 5,
        "full_only": True,
        "question_text": "a stateless api issues a jwt with a 24-hour expiry and no revocation list. a token is stolen. what is the most practical short-term mitigation?",
        "correct": "shorten token lifetime and rotate the signing key, forcing re-authentication",
        "wrong": [
            "lengthen token lifetime to reduce repeated thefts",
            "store the token in the url for monitoring",
            "disable https to simplify debugging",
        ],
    },
    {
        "unit": 5,
        "question_text": "an api endpoint /api/user/update accepts any user id from the client and updates it. logged-in users can alter others' profiles. which vulnerability is this and what is the fix?",
        "correct": "broken object level authorization; enforce server-side checks that the caller owns or may modify the object",
        "wrong": [
            "sql injection; parameterize queries",
            "xss; encode output",
            "clickjacking; add frame-ancestors",
        ],
    },
    {
        "unit": 5,
        "question_text": "a db backup file data.sql.gz is downloadable at /backups/data.sql.gz on the public site. what is the correct severity and immediate action?",
        "correct": "critical; remove the file, rotate any credentials it contains, and block directory listing",
        "wrong": [
            "low; backups are compressed and therefore safe",
            "medium; move it to /assets instead",
            "informational; search engines rarely index .gz files",
        ],
    },
    {
        "unit": 5,
        "full_only": True,
        "question_text": "which password storage scheme is correct for a modern web application?",
        "correct": "store a salted adaptive hash such as argon2id or bcrypt",
        "wrong": [
            "store md5 hashes with a per-user salt",
            "store aes-encrypted passwords with a global key",
            "store base64-encoded passwords for reversibility",
        ],
    },
    {
        "unit": 5,
        "question_text": "a framework update fixes a deserialization flaw exploited in the wild. the org cannot patch for two weeks. which compensating control is most realistic?",
        "correct": "a waf rule blocking known exploit payloads plus monitoring for exploitation attempts",
        "wrong": [
            "disabling all logging to save cpu",
            "renaming the vulnerable endpoint",
            "adding a second factor to the db password",
        ],
    },
    {
        "unit": 5,
        "question_text": "a session cookie lacks the secure and httponly flags and the site allows http. which combination best describes the exposure and fix?",
        "correct": "session theft via network interception or xss; set secure, httponly, samesite and redirect http to https",
        "wrong": [
            "sql injection; parameterize queries",
            "clickjacking; add frame-ancestors",
            "idor; enforce object ownership",
        ],
    },
    {
        "unit": 5,
        "full_only": True,
        "question_text": "an admin panel is 'hidden' at /admin-9f3e2c. is this an effective control and why?",
        "correct": "no; obscurity is not access control and endpoints are discoverable; require authentication and authorization",
        "wrong": [
            "yes; unguessable urls are effectively secret keys",
            "yes; search engines cannot index hyphenated paths",
            "partially; it stops automated scanners entirely",
        ],
    },
    {
        "unit": 5,
        "question_text": "which task pair correctly matches task verb to action?",
        "correct": "identify - point to specific evidence in the sources; determine - apply reasoning to reach a specific result",
        "wrong": [
            "identify - invent a likely cause; determine - restate the question",
            "explain - list facts without reasons; describe - argue a position",
            "write - summarize the sources; explain - copy a config line",
        ],
    },
    {
        "unit": 5,
        "full_only": True,
        "question_text": "an frq source shows apache listening on 80 and 443, a world-readable config with db credentials, and failed ftp logins from one external ip. which frq part does the world-readable config most likely support?",
        "correct": "explaining how file permissions determine access levels for owner, group, and others",
        "wrong": [
            "identifying the adversary's ip from a firewall log",
            "describing a blocked connection attempt",
            "writing a chmod command for the auth log",
        ],
    },
    {
        "unit": 5,
        "question_text": "a web server's access log shows many 'get /../../etc/passwd' requests from one ip. as the frq asks, what is one way an automated system could halt this in real time?",
        "correct": "an ips or waf matching traversal patterns and dropping the requests as they arrive",
        "wrong": [
            "a nightly log review by the security team",
            "a weekly patch cycle for the web server",
            "a backup job run every hour",
        ],
    },
    {
        "unit": 5,
        "full_only": True,
        "question_text": "which countermeasure is most different in kind from an ips for stopping directory traversal, as frq part e(iv) would expect?",
        "correct": "developer-implemented input validation in the application",
        "wrong": [
            "a second ips from another vendor",
            "a faster firewall appliance",
            "a bigger ids signature database",
        ],
    },
    {
        "unit": 5,
        "question_text": "a dev team stores api keys in a public github repo's history. what is the complete correct response?",
        "correct": "revoke and rotate the keys immediately; removing the commit alone is insufficient because history persists",
        "wrong": [
            "delete the file and commit; that removes the secret",
            "make the repo private; the keys become safe",
            "rename the keys to look like variables",
        ],
    },
    {
        "unit": 5,
        "full_only": True,
        "question_text": "an app accepts a url parameter 'template' and fetches it server-side. an attacker passes http://169.254.169.254/latest/meta-data/. which vulnerability is this and what does it target?",
        "correct": "ssrf; it targets cloud instance metadata credentials",
        "wrong": [
            "xss; it targets other users' browsers",
            "sql injection; it targets the database",
            "csrf; it targets user sessions",
        ],
    },
    {
        "unit": 5,
        "question_text": "a news site's comment form is used to redirect victims to a phishing page via injected html. which control set most directly prevents this?",
        "correct": "output encoding, input validation, and a content security policy",
        "wrong": [
            "a stateful firewall and vpn",
            "full-disk encryption on the server",
            "rate limiting and ip allowlists only",
        ],
    },
    {
        "unit": 5,
        "question_text": "which sequence correctly orders an attacker's typical web exploitation steps?",
        "correct": "probe inputs, identify a flaw, craft a payload, extract or modify data, establish persistence",
        "wrong": [
            "establish persistence, probe inputs, identify a flaw, craft a payload",
            "craft a payload, extract data, probe inputs, identify a flaw",
            "identify a flaw, establish persistence, probe inputs, extract data",
        ],
    },
    {
        "unit": 5,
        "full_only": True,
        "question_text": "an org must choose where to spend: a waf in front of one legacy app, or fixing the app's sql injection in code. which choice and reasoning are best?",
        "correct": "fix the code; the vulnerability is eliminated rather than filtered, and waf bypasses are common",
        "wrong": [
            "buy the waf; it protects everything forever",
            "buy the waf; code fixes are impossible for legacy apps",
            "neither; document the risk and accept it",
        ],
    },
    {
        "unit": 5,
        "question_text": "a form field accepts up to 5000 characters when the backend expects 10. what is the security-relevant concern and the fix?",
        "correct": "oversized input can stress parsing and enable injection; validate length and type server-side",
        "wrong": [
            "only aesthetics; long text looks bad",
            "bandwidth cost; add a faster nic",
            "storage cost; compress the database",
        ],
    },
    {
        "unit": 5,
        "question_text": "an sso provider's login page is protected, but a partner site's iframe can be tricked into clicking the provider's buttons invisibly. which vulnerability and header fix this?",
        "correct": "clickjacking; use content-security-policy frame-ancestors",
        "wrong": [
            "xss; use content-security-policy script-src",
            "csrf; use samesite cookies",
            "ssrf; use egress filtering",
        ],
    },
    {
        "unit": 5,
        "full_only": True,
        "question_text": "a dev asks why 'we hash passwords if we already use https'. what is the correct explanation?",
        "correct": "https protects data in transit; hashing protects the stored credential if the database is stolen",
        "wrong": [
            "https already protects stored passwords; hashing is redundant",
            "hashing protects data in transit; https protects the database",
            "hashing makes passwords faster to check",
        ],
    },
    {
        "unit": 5,
        "question_text": "an audit finds the same service account and password on 40 servers, granted admin everywhere. which single change most reduces blast radius?",
        "correct": "per-host unique credentials with least-privilege roles",
        "wrong": [
            "longer password for the shared account",
            "monthly rotation of the shared password",
            "renaming the account to something obscure",
        ],
    },
    {
        "unit": 5,
        "question_text": "which scenario is a supply chain compromise?",
        "correct": "a malicious update pushed through a trusted vendor's signed build pipeline",
        "wrong": [
            "an intern plugging in a usb stick found outside",
            "a phished user entering credentials on a look-alike site",
            "a brute force attack against an ssh endpoint",
        ],
    },
    {
        "unit": 5,
        "full_only": True,
        "question_text": "an frq source 6 aup prohibits social media and removable media. a user violates both and the device is later compromised. which frq-style part does this best support?",
        "correct": "explaining how a policy rule helps protect the device and how a rule could be modified for more security",
        "wrong": [
            "identifying the ip address of the adversary",
            "writing a chmod command for a config file",
            "describing a blocked firewall connection",
        ],
    },
    {
        "unit": 5,
        "question_text": "a data breach exposed 1 million records because a staging database was internet-facing with no auth. which root cause class best fits?",
        "correct": "misconfiguration of deployment and access controls",
        "wrong": [
            "zero-day exploitation of the db engine",
            "insider theft of credentials",
            "physical theft of drives",
        ],
    },
    {
        "unit": 5,
        "full_only": True,
        "question_text": "a team adopts a sdl. which practice gives the largest early return for injection flaws?",
        "correct": "code review plus static analysis gates in the build pipeline",
        "wrong": [
            "annual penetration testing only",
            "a bug bounty program only",
            "network segmentation of the office lan",
        ],
    },
    {
        "unit": 5,
        "question_text": "an api returns full user objects including password hashes to any authenticated user at /api/user/{id}. which two fixes apply together?",
        "correct": "object-level authorization plus response field filtering",
        "wrong": [
            "output encoding and a csp",
            "rate limiting and waf",
            "https and hsts",
        ],
    },
    {
        "unit": 5,
        "full_only": True,
        "question_text": "which statement best compares encryption at rest and in transit for a web app's database?",
        "correct": "at-rest protects stored files from offline theft; in-transit protects app-to-db queries on the network; both are needed",
        "wrong": [
            "in-transit alone suffices because databases are never stolen",
            "at-rest alone suffices because networks are trusted",
            "neither matters if the os is patched",
        ],
    },
    {
        "unit": 5,
        "question_text": "a post-incident review finds the frq-style lesson: logs existed, but no one looked. which control improvement is most on-point?",
        "correct": "centralize logs and add alerts with a defined review process",
        "wrong": [
            "delete old logs to reduce clutter",
            "log only successful logins",
            "disable logs on busy servers",
        ],
    },
]

FRQ_BANK: dict[int, dict] = {
    # every exam gets the full device security analysis, exactly like the real
    # exam's section ii. sources are shared by all six exams; unit exams may
    # trim the parts most tied to other units in the future.
    0: {
        "title": "device security analysis",
        "prompt": (
            "the following sources all come from the same device and are captured in a "
            "risk assessment for this device. use the given information to respond to "
            "parts a, b, c, d, and e. label any subparts (e.g., i and ii) that may be present."
        ),
        "sources": [
            {
                "label": "source 1",
                "title": "device firewall settings",
                "body": (
                    "the device's ip address is 192.168.1.10.\n\n"
                    "rule | action | source | destination | direction | port | protocol\n"
                    "1 | deny | 172.45.66.184 | 192.168.1.10 | inbound | 22 | ssh\n"
                    "2 | allow | all | 192.168.1.10 | inbound | 21 | ftp\n"
                    "3 | allow | all | 192.168.1.10 | inbound | 80 | http\n"
                    "4 | allow | all | 192.168.1.10 | inbound | 445 | smb\n"
                    "5 | allow | all | 192.168.1.10 | inbound | 443 | https\n"
                    "6 | allow | all | 192.168.1.10 | inbound | 22 | ssh\n"
                    "7 | allow | 172.45.66.184 | 192.168.1.10 | inbound | 3306 | mysql\n"
                    "8 | allow | all | 192.168.1.10 | inbound | 3389 | rdp\n"
                    "9 | allow | 192.168.1.50 | 192.168.1.10 | inbound | 5900 | vnc\n"
                    "10 | deny | all | all | inbound | all | all"
                ),
            },
            {
                "label": "source 2",
                "title": "authorization log (excerpt)",
                "body": (
                    "nov 10 14:11:43 ubuntu sshd[1123]: server listening on 0.0.0.0 port 22.\n"
                    "nov 10 14:11:43 ubuntu sshd[1123]: server listening on :: port 22.\n"
                    "nov 10 14:21:01 ubuntu vsftpd[2184]: failed login for invalid user admin from 203.0.113.25 port 21 ftp\n"
                    "nov 10 14:21:02 ubuntu vsftpd[2186]: failed login for invalid user root from 203.0.113.25 port 21 ftp\n"
                    "nov 10 14:21:03 ubuntu vsftpd[2188]: failed login for invalid user test from 203.0.113.25 port 21 ftp\n"
                    "nov 10 14:21:04 ubuntu vsftpd[2190]: failed login for invalid user guest from 203.0.113.25 port 21 ftp\n"
                    "nov 10 14:21:05 ubuntu vsftpd[2192]: failed login for invalid user ubuntu from 203.0.113.25 port 21 ftp\n"
                    "nov 10 14:21:06 ubuntu vsftpd[2194]: failed login for invalid user deploy from 203.0.113.25 port 21 ftp\n"
                    "nov 10 14:21:07 ubuntu vsftpd[2196]: failed login for invalid user support from 203.0.113.25 port 21 ftp\n"
                    "nov 10 14:21:08 ubuntu vsftpd[2198]: failed login for invalid user admin1 from 203.0.113.25 port 21 ftp\n"
                    "nov 10 14:21:09 ubuntu vsftpd[2200]: failed login for invalid user oracle from 203.0.113.25 port 21 ftp\n"
                    "nov 10 14:21:10 ubuntu vsftpd[2202]: failed login for invalid user ftp from 203.0.113.25 port 21 ftp\n"
                    "nov 10 14:22:14 ubuntu sshd[2234]: connection closed by authenticating user jprice 192.168.1.50 port 22 [preauth]\n"
                    "nov 10 14:22:15 ubuntu sshd[2234]: accepted password for jprice from 192.168.1.50 port 22 ssh2\n"
                    "nov 10 14:25:47 ubuntu sudo: jprice : tty=pts/0 ; user=root ; command=/usr/bin/apt update\n"
                    "nov 10 14:30:17 ubuntu kernel: [ufw block] in=eth0 src=203.0.113.25 dst=192.168.1.10 proto=tcp port=25 syn\n"
                    "nov 10 14:30:18 ubuntu sshd[2369]: failed password for invalid user user from 203.0.113.25 port 22 ssh2\n"
                    "nov 10 14:30:18 ubuntu kernel: [ufw block] in=eth0 src=203.0.113.25 dst=192.168.1.10 proto=tcp port=77 syn"
                ),
            },
            {
                "label": "source 3",
                "title": "web server access log (excerpt)",
                "body": (
                    "192.168.1.50 - jprice [10/nov/2025:09:02:14] \"get /index.html http/1.1\" 200 4212\n"
                    "192.168.1.50 - jprice [10/nov/2025:09:02:20] \"post /contact_form http/1.1\" 200 87\n"
                    "192.168.1.55 - - [10/nov/2025:09:03:10] \"get /api/user/profile?id=12 http/1.1\" 200 614 \"curl/7.81.0\"\n"
                    "10.0.0.5 - admin [10/nov/2025:09:04:03] \"get /admin/dashboard http/1.1\" 200 6275\n"
                    "203.0.113.45 - - [10/nov/2025:09:04:11] \"get ../../../../etc/passwd http/1.1\" 400 234 \"curl/7.68.0\"\n"
                    "203.0.113.45 - - [10/nov/2025:09:04:12] \"get ../../../etc/shadow http/1.1\" 403 312 \"curl/7.68.0\"\n"
                    "203.0.113.45 - - [10/nov/2025:09:04:13] \"get ../../../var/www/html/config.php.bak http/1.1\" 404 198 \"curl/7.68.0\"\n"
                    "192.168.1.55 - - [10/nov/2025:09:05:23] \"get /api/docs http/1.1\" 200 682 \"curl/7.81.0\""
                ),
            },
            {
                "label": "source 4",
                "title": "file listing",
                "body": (
                    "ls -l /home/jprice/documents\n"
                    "-rw-r--r-- 1 jprice jprice 2143 nov 08 09:15 report.txt\n"
                    "-rw------- 1 jprice jprice 1024 nov 02 09:01 secrets.key\n"
                    "-rwxr-xr-x 1 jprice jprice 8576 nov 10 11:02 backup.sh\n"
                    "-r--r----- 1 jprice admin 3421 nov 06 11:53 config.cfg\n"
                    "-rw-rw-r-- 1 jprice devteam 5012 nov 10 09:04 notes.md\n"
                    "-rw-rw-rw- 1 jprice shared 3999 nov 01 12:08 public_data.csv\n"
                    "-rw-r----- 1 jprice admin 2088 nov 09 09:36 database.ini"
                ),
            },
            {
                "label": "source 5",
                "title": "acceptable use policy",
                "body": (
                    "required activities:\n"
                    "- users must keep the operating system and installed software up to date.\n"
                    "permitted activities:\n"
                    "- users may connect peripheral devices such as keyboards, mice, monitors, and printers as needed for daily work.\n"
                    "prohibited activities:\n"
                    "- users may not connect external drives, usb storage devices, or other removable media unless explicitly authorized.\n"
                    "- users may not modify system configurations, security settings, or access controls without authorization.\n"
                    "- users may not access social media websites on this device."
                ),
            },
        ],
        "parts": [
            {
                "label": "part a",
                "prompt": "consider the policy for the device in source 5.\ni. explain how one part of the policy helps protect the device.\nii. explain how one rule in the current policy could be modified to make the device more secure. include a specific example in your response.",
            },
            {
                "label": "part b",
                "prompt": "in the authorization log, there is evidence of a password attack in rows 3-12.\ni. describe the evidence in the log file that indicates a password attack. include specific entries from the log file in your response.\nii. identify the ip address of the adversary.",
            },
            {
                "label": "part c",
                "prompt": "consider all the sources from the device.\ni. explain how the permission settings for one file in /home/jprice/documents determine the level of access for that file for the owner, group, and all other users on the system. include the name of the file in your response.\nii. other than removing all permissions from all users, describe one way the permission settings for one file on the system could be configured to restrict access for some users on the device. include the name of the file in your response.\niii. using the explanation from part c (ii), write one or more chmod commands that set the permissions described.",
            },
            {
                "label": "part d",
                "prompt": "consider all the sources from the device.\ni. explain how one connection attempt on the device was blocked by the device's firewall. include evidence from a log file in your response.\nii. other than allowing all traffic for all services, describe a modification to one firewall rule that would allow the connection attempt identified in part d (i).\niii. other than allowing the connection attempt identified in part d (i), describe one impact of your modification from part d (ii) on incoming or outgoing network traffic on the device.",
            },
            {
                "label": "part e",
                "prompt": "apart from the password attack identified in part b, there is evidence of another attack on the device. consider all the sources from the device.\ni. determine the type of attack evidenced in a log file.\nii. describe specific information in the log file that indicates the attack named in part e (i).\niii. describe one way an automated system could halt this type of attack in real time.\niv. this attack could be mitigated by an automated system, such as a firewall, ids, ips, or ai. identify a different countermeasure that could mitigate, prevent, or deter the attack.",
            },
        ],
        "rubric": (
            "score by the official frq style: award credit per part for correct, "
            "evidence-cited answers. part a (2 pts): one protective rule explained; one "
            "modification with a specific example. part b (2 pts): describes repeated failed "
            "logins for invalid users from 203.0.113.25; identifies that ip. part c (3 pts): "
            "explains owner/group/other permission bits for a named file; proposes a realistic "
            "restriction; writes a correct chmod command for it. part d (3 pts): cites a ufw "
            "block line as evidence; proposes a scoped rule change (e.g., allow smtp from a "
            "known relay instead of all); states a plausible traffic impact of that change. "
            "part e (4 pts): determines directory traversal from source 3; cites the ../../ "
            "requests from 203.0.113.45; describes an ips/waf halting it in real time; names "
            "a non-automated countermeasure such as input validation or removing the backup file. "
            "total 14 points."
        ),
    },
}
