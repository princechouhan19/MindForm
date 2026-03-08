/**
 * MindForm — Email Validation & Anti-Abuse Guard
 * Server-side only. Blocks disposable/temp mail, suspicious patterns,
 * banned local parts, and enforces real TLD structure.
 */

// ─── 1. DISPOSABLE / TEMP MAIL DOMAIN BLOCKLIST ───────────────────────────────
// Sources: public spam/disposable domain lists, manually curated
const BLOCKED_DOMAINS = new Set([
  // ── Mailinator family ─────────────────────────────────────────────────────
  'mailinator.com','mailinator2.com','mailinator.net','mailinater.com',
  'tradermail.info','suremail.info','spamgourmet.com','spamgourmet.net',
  'spamgourmet.org','safetymail.info','mt2009.com','mt2014.com',
  // ── Guerrilla Mail family ─────────────────────────────────────────────────
  'guerrillamail.com','guerrillamail.net','guerrillamail.org','guerrillamail.de',
  'guerrillamail.info','guerrillamailblock.com','grr.la','sharklasers.com',
  'guerrillamailblock.com','spam4.me',
  // ── Yopmail family ───────────────────────────────────────────────────────
  'yopmail.com','yopmail.fr','yopmail.pp.ua','cool.fr.nf','jetable.fr.nf',
  'nospam.ze.tc','nomail.xl.cx','mega.zik.dj','speed.1s.fr','courriel.fr.nf',
  'moncourrier.fr.nf','monemail.fr.nf','monmail.fr.nf',
  // ── Throw Away / Temp families ────────────────────────────────────────────
  'throwam.com','throwaway.email','tempmail.com','temp-mail.org','temp-mail.io',
  'temp-mail.ru','tempmail.net','tempmail.org','tempmailo.com','tmpmail.net',
  'tmpmail.org','tempr.email','tempinbox.com','dispostable.com','disposableemailaddresses.com',
  'disposablemail.es','disposablemails.com','crazymailing.com','fakeinbox.com',
  'fakeinbox.net','fakemailgenerator.com','fakemailgenerator.net',
  // ── 10 Minute Mail family ─────────────────────────────────────────────────
  '10minutemail.com','10minutemail.net','10minutemail.org','10minutemail.de',
  '10minutemail.co.uk','10minutemail.be','10minutemail.nl','10minemail.com',
  '10minutemail.cf','10minutemail.ga','10minutemail.gq','10minutemail.ml',
  '10minutemail.tk','10minutemail.ru','10minutemail.us','10minutemail.info',
  '10minutemailbox.com','10minutepost.com',
  // ── Trashmail / Spambox ───────────────────────────────────────────────────
  'trashmail.at','trashmail.com','trashmail.me','trashmail.io','trashmail.net',
  'trashmail.org','trashmail.xyz','trashmailer.com','trash-mail.at',
  'trash-mail.com','spambox.us','spambox.org','spambox.info','spambox.irishspringrealty.com',
  'spamspot.com','spamthis.co.uk','spamfree24.org','spamfree.eu',
  // ── Dead Drop / Burner ────────────────────────────────────────────────────
  'burnermail.io','bouncr.com','discard.email','discardmail.com','discardmail.de',
  'dodgit.com','dodgit.org','hair2019.com','harakirimail.com',
  // ── Mailnull / Maildrop / Nada ────────────────────────────────────────────
  'mailnull.com','maildrop.cc','maildrop.ml','nada.email','nada.ltd',
  'nadamail.com','mailnull.com','mailni.com',
  // ── Throwam / AntiSpam / Sharklasers etc ──────────────────────────────────
  'jetable.com','jetable.fr','jetable.net','jetable.org','jetable.pp.ua',
  'throwam.com','owlpic.com','spaml.de','spaml.com',
  // ── Maildrop / Inboxkitten / MailBoxy ────────────────────────────────────
  'inboxkitten.com','mailboxy.fun','mail.tm','getairmail.com',
  'mailsac.com','mailsac.net','throwbin.io','discard.tk',
  // ── Popular disposable platforms ──────────────────────────────────────────
  'mailtemp.info','mailtemp.net','tempinbox.net','sharklasers.com',
  'armyspy.com','cuvox.de','dayrep.com','einrot.com','fleckens.hu',
  'gustr.com','jourrapide.com','rhyta.com','superrito.com','teleworm.us',
  'zetmail.com','ytnef.com','emlhub.com','hidemail.de','incognitomail.org',
  // ── .xyz / suspicious TLD combos ─────────────────────────────────────────
  'getnada.com','luxusmail.org','iroid.com','mailed.ro','mbox.re',
  'proxymail.eu','rcpt.at','rtrtr.com','sogetthis.com','spamoff.de',
  'supermailer.jp','tempalias.com','tempe-mail.com','tempinbox.com',
  'temporaryemail.net','throwablemail.com','uggsrock.com',
  'ypemail.com','zebins.com','zebins.eu','zehnminuten.de',
  // ── Russian / Eastern European temp mail ──────────────────────────────────
  'tempmail.ru','mail.ru.temp.com','freemail.ms','meltmail.com','mvrht.net',
  // ── One-click / short-lived ───────────────────────────────────────────────
  'yomail.info','zoemail.net','33mail.com','mailnew.com','maildx.com',
  'anonbox.net','anonymbox.com','kurzepost.de','objectmail.com',
  'oneoffmail.com','onewaymail.com','online.ms','pookmail.com',
  'postacı.net','powered.name','put2.net','recursor.net','rejectmail.com',
  'safetypost.de','segmail.eu','sendspamhere.com','shut.ws','shut.name',
  'sofimail.com','soodonims.com','spam.la','spamavert.com','spamcorptastic.com',
  // ── BurnerMail / AnonEmail / SecMail ─────────────────────────────────────
  'anonmail.top','secmail.pro','secmail.pw','secmail.xyz',
  'vomoto.com','yoru-dea.com','your-mail.com',
  // ── Misc common disposables ───────────────────────────────────────────────
  'mailmoat.com','mailnew.com','mailnew.net', 'mailnew.org','mailninja.co.uk',
  'mailnull.com','mailquack.com','mailrock.biz','mailscrap.com',
  'mailshell.com','mailsiphon.com','mailslite.com','mailslurp.com',
  'mailtemp.net','mailtemporaire.fr','mailtemp.info','mailzilla.com',
  'easytrashmail.com','emailondeck.com','emailsensei.com',
  'emailtemporanea.net','emailtemporanea.com','emailtemporanea.org',
  'emailto.de','emailxfer.com','emkei.cz','emz.net',
  'e4ward.com','enterto.com','evanfox.com',
  'explodemail.com','explodingmail.com',
])

// ─── 2. SUSPICIOUS LOCAL-PART PATTERNS ────────────────────────────────────────
// Block emails whose local part (before @) looks obviously fake/test
const BANNED_LOCAL_PATTERNS = [
  /^test[0-9_@.-]*$/i,
  /^fake[0-9_@.-]*$/i,
  /^temp[0-9_@.-]*$/i,
  /^trash[0-9_@.-]*$/i,
  /^spam[0-9_@.-]*$/i,
  /^disposable/i,
  /^throwaway/i,
  /^burner/i,
  /^noreply/i,
  /^no-reply/i,
  /^nobody/i,
  /^user1234/i,
  /^admin[0-9]*/i,
  /^root[0-9]*/i,
  /^info@/i,       // caught before @ but double check
  /^contact@/i,
  /^demo[0-9_]*/i,
  /^abc[0-9]+/i,
  /^aaa+/i,
  /^zzz+/i,
  /^xxx+/i,
  /^[a-z]{1,3}[0-9]{4,}$/i,  // e.g. ab12345 — looks bot-generated
  /^[0-9]{6,}$/,              // all-numeric local part
  /^(.)\1{4,}$/,              // repeated char: aaaaaaa@...
]

// ─── 3. SUSPICIOUS NAME PATTERNS ─────────────────────────────────────────────
const BANNED_NAME_PATTERNS = [
  /^test\s*user$/i,
  /^fake\s*user$/i,
  /^a+$/i,
  /^[0-9]+$/,
  /^(.)\1{4,}$/,
  /^\s*$/,
]

// ─── 4. ALLOWED TLDs (must be a real recognisable extension) ──────────────────
// We block single-character TLDs and commonly abused combos
const BLOCKED_TLDS_PATTERNS = [
  /\.cf$/i,   // known spam TLD
  /\.gq$/i,   // known spam TLD
  /\.tk$/i,   // known spam TLD
  /\.ml$/i,   // often abused
  /\.ga$/i,   // often abused
]

// ─── 5. MAIN VALIDATION FUNCTION ─────────────────────────────────────────────
function validateRegistration({ name, email }) {
  const errors = []

  const emailLower = (email || '').toLowerCase().trim()
  const nameTrimmed = (name || '').trim()

  // ── Basic format check ─────────────────────────────────────────────────────
  const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/
  if (!emailRegex.test(emailLower)) {
    errors.push('Please enter a valid email address.')
    return { valid: false, errors }
  }

  const [localPart, domainPart] = emailLower.split('@')
  const domainParts = domainPart.split('.')
  const tld = domainParts[domainParts.length - 1]

  // ── TLD too short ──────────────────────────────────────────────────────────
  if (tld.length < 2) {
    errors.push('Email domain does not appear to be valid.')
  }

  // ── Blocked TLDs ──────────────────────────────────────────────────────────
  for (const pattern of BLOCKED_TLDS_PATTERNS) {
    if (pattern.test(domainPart)) {
      errors.push('Emails from this domain are not accepted. Please use a real email address.')
      break
    }
  }

  // ── Blocked disposable domains ────────────────────────────────────────────
  if (BLOCKED_DOMAINS.has(domainPart)) {
    errors.push('Temporary or disposable email addresses are not allowed. Please register with your real email.')
  }

  // ── Suspicious local part ─────────────────────────────────────────────────
  for (const pattern of BANNED_LOCAL_PATTERNS) {
    if (pattern.test(localPart)) {
      errors.push('This email address does not look genuine. Please use your real email.')
      break
    }
  }

  // ── Local part too short ──────────────────────────────────────────────────
  if (localPart.length < 2) {
    errors.push('Email address is too short to be valid.')
  }

  // ── Domain must have at least one dot ─────────────────────────────────────
  if (!domainPart.includes('.') || domainParts.length < 2) {
    errors.push('Email domain is not valid.')
  }

  // ── Suspicious name validation ────────────────────────────────────────────
  for (const pattern of BANNED_NAME_PATTERNS) {
    if (pattern.test(nameTrimmed)) {
      errors.push('Please enter your real name.')
      break
    }
  }

  // ── Name minimum length ───────────────────────────────────────────────────
  if (nameTrimmed.length < 2) {
    errors.push('Name must be at least 2 characters.')
  }

  // ── Name can't be just numbers ────────────────────────────────────────────
  if (/^[0-9\s]+$/.test(nameTrimmed)) {
    errors.push('Name cannot be only numbers.')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

module.exports = { validateRegistration }
