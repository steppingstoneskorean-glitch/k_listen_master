// Well-known disposable / temporary email domains. Sourced from
// https://github.com/disposable-email-domains/disposable-email-domains
// (trimmed to the most-abused ~300 services to keep bundle size small).
const DISPOSABLE_DOMAINS = new Set([
  // ── mailinator family ──
  'mailinator.com', 'mailinator2.com', 'mailinator.net', 'mailinator.org',
  'mailinator.us', 'mailinator.co.uk', 'mailinator.info',
  // ── yopmail family ──
  'yopmail.com', 'yopmail.fr', 'cool.fr.nf', 'jetable.fr.nf',
  'nospam.ze.tc', 'nomail.xl.cx', 'mega.zik.dj', 'speed.1s.fr',
  'courriel.fr.nf', 'moncourrier.fr.nf', 'monemail.fr.nf', 'monmail.fr.nf',
  // ── guerrilla mail ──
  'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.org',
  'guerrillamail.biz', 'guerrillamail.de', 'guerrillamail.info',
  'guerrillamailblock.com', 'spam4.me',
  // ── 10 minute mail ──
  '10minutemail.com', '10minutemail.net', '10minutemail.org',
  '10minutemail.co.uk', '10minutemail.de', '10minutemail.co.za',
  '10minutemail.cf', '10minutemail.ga', '10minutemail.gq',
  '10minutemail.ml', '10minutemail.tk', '10minutemail.us',
  '10minemail.com', '10minutesemail.com', '10minutesmail.com',
  // ── temp-mail / tempmail ──
  'temp-mail.org', 'temp-mail.io', 'temp-mail.ru', 'tempmail.com',
  'tempmail.de', 'tempmail.net', 'tempmail.org', 'tempmailo.com',
  'tempr.email', 'tempinbox.com', 'tmails.net',
  // ── throwaway / trashmail ──
  'throwaway.email', 'throwam.com',
  'trashmail.com', 'trashmail.at', 'trashmail.de', 'trashmail.io',
  'trashmail.me', 'trashmail.net', 'trashmail.org', 'trashmail.com',
  // ── mailnull / fakeinbox ──
  'mailnull.com', 'fakeinbox.com', 'fakeinbox.net', 'fake-box.com',
  'fakedemail.com',
  // ── dispostable / disposableaddress ──
  'dispostable.com', 'disposableaddress.com', 'disposable.com',
  // ── spamgourmet ──
  'spamgourmet.com', 'spamgourmet.net', 'spamgourmet.org',
  // ── mailnesia / mailnull ──
  'mailnesia.com',
  // ── sharklasers / guerrilla aliases ──
  'sharklasers.com', 'guerrillamailblock.com', 'grr.la', 'guerrillamail.info',
  // ── maildrop ──
  'maildrop.cc',
  // ── spamfree24 / spamfree ──
  'spamfree24.org', 'spamfree24.de', 'spamfree24.eu', 'spamfree24.info',
  'spamfree24.net',
  // ── airmail / getairmail ──
  'getairmail.com',
  // ── crap.email / crap variants ──
  'crap.email', 'crazymailing.com',
  // ── mailexpire / discard.email ──
  'discard.email', 'mailexpire.com',
  // ── mailforspam ──
  'mailforspam.com',
  // ── no-spam / nospam ──
  'no-spam.ws', 'nospamfor.us', 'nospam4.us', 'nospamthanks.info',
  // ── spamhereplease / spamhere ──
  'spamhereplease.com',
  // ── owlpic / owlmail ──
  // ── anonbox / anonymail ──
  'anonbox.net', 'anonymail.dk',
  // ── fakemailgenerator ──
  'fakemailgenerator.com', 'fakemailgenerator.net',
  // ── filzmail ──
  'filzmail.com',
  // ── e4ward ──
  'e4ward.com',
  // ── emailondeck ──
  'emailondeck.com',
  // ── sogetthis / anonaddy / simplelogin (legitimate forwarding — keep?) ──
  // (omitted — simplelogin and anonaddy are privacy tools, not abuse vectors)
  // ── spamex ──
  'spamex.com',
  // ── tempinbox ──
  'tempe-mail.com', 'tempinbox.co.uk',
  // ── trash-mail ──
  'trash-mail.at', 'trash-mail.com', 'trash-mail.de', 'trash-mail.io',
  // ── jetable ──
  'jetable.com', 'jetable.fr', 'jetable.net', 'jetable.org',
  // ── mytrashmail ──
  'mytrashmail.com', 'mytrashmail.at', 'mytrashmail.de',
  // ── mailnow / nowmymail ──
  // ── mailbolt / bolt ──
  // ── binkmail ──
  'binkmail.com',
  // ── bobmail ──
  'bobmail.info',
  // ── bogusmailaddress ──
  // ── cool.fr.nf & cie ──
  // ── daemsteam ──
  'daemsteam.com',
  // ── dingbone ──
  'dingbone.com',
  // ── dontreg / dont register ──
  'dontreg.com', 'dontsendmespam.de',
  // ── einrot ──
  'einrot.com', 'einrot.de',
  // ── emailfake ──
  'emailfake.com',
  // ── emailisvalid ──
  'emailisvalid.com',
  // ── emailtemporary ──
  'emailtemporary.com',
  // ── fast-email ──
  'fast-email.com',
  // ── fastaccess ──
  'fastaccess.cn',
  // ── filzmail ──
  'filzmail.de',
  // ── for-president / for-senator ──
  'for-president.com',
  // ── freemail / freemails ──
  // ── get1mail ──
  'get1mail.com',
  // ── getonemail ──
  'getonemail.net',
  // ── girlsundertheinfluence ──
  // ── gishpuppy ──
  'gishpuppy.com',
  // ── grr.la ──
  // ── haltospam ──
  'haltospam.com',
  // ── herp.in ──
  'herp.in',
  // ── hidemail ──
  'hidemail.de', 'hidemail.pro',
  // ── hmamail ──
  'hmamail.com',
  // ── hopemail ──
  'hopemail.biz',
  // ── hulapla ──
  'hulapla.de',
  // ── ieatspam ──
  'ieatspam.eu', 'ieatspam.info',
  // ── ihateyoualot ──
  'ihateyoualot.info',
  // ── imails ──
  'imails.net',
  // ── inoutmail ──
  'inoutmail.de', 'inoutmail.eu', 'inoutmail.info', 'inoutmail.net',
  // ── instantemailaddress ──
  'instantemailaddress.com',
  // ── junk1 ──
  'junk1.net', 'junkmail.com',
  // ── kasmail ──
  'kasmail.com',
  // ── killmail ──
  'killmail.com', 'killmail.net',
  // ── klzlk ──
  'klzlk.com',
  // ── koszmail ──
  'koszmail.pl',
  // ── kurzepost ──
  'kurzepost.de',
  // ── lifebyfood ──
  // ── link2mail ──
  'link2mail.net',
  // ── lol.com variants ──
  // ── lookugly ──
  'lookugly.com',
  // ── lortemail ──
  'lortemail.dk',
  // ── maail ──
  'maail.com',
  // ── mail-temporaire ──
  'mail-temporaire.fr',
  // ── mail1a ──
  'mail1a.de',
  // ── mail2rss ──
  'mail2rss.org',
  // ── mail333 ──
  'mail333.com',
  // ── mailbidon ──
  'mailbidon.com',
  // ── mailblocks ──
  // ── mailc ──
  'mailc.net',
  // ── mailcan ──
  'mailcan.com',
  // ── mailcat ──
  'mailcat.biz',
  // ── mailcatch ──
  'mailcatch.com',
  // ── mailde.de ──
  'mailde.de', 'mailde.info',
  // ── maildu ──
  'maildu.de',
  // ── maileimer ──
  'maileimer.de',
  // ── mailguard ──
  'mailguard.de',
  // ── mailimate ──
  'mailimate.com',
  // ── mailin8r ──
  'mailin8r.com',
  // ── mailinater ──
  'mailinater.com',
  // ── mailismagic ──
  'mailismagic.com',
  // ── mailme ──
  'mailme.ir', 'mailme.lv',
  // ── mailmetrash ──
  'mailmetrash.com',
  // ── mailmoat ──
  'mailmoat.com',
  // ── mailms ──
  'mailms.com',
  // ── mailnew ──
  'mailnew.com',
  // ── mailpick ──
  'mailpick.biz',
  // ── mailprotech ──
  'mailprotech.com',
  // ── mailquack ──
  'mailquack.com',
  // ── mailrock ──
  'mailrock.biz',
  // ── mailscrap ──
  'mailscrap.com',
  // ── mailshell ──
  'mailshell.com',
  // ── mailsiphon ──
  'mailsiphon.com',
  // ── mailslite ──
  'mailslite.com',
  // ── mailsucker ──
  'mailsucker.net',
  // ── mailtemp ──
  'mailtemp.info',
  // ── mailtome ──
  'mailtome.de',
  // ── mailtothis ──
  'mailtothis.com',
  // ── mailtrash ──
  'mailtrash.net',
  // ── mailtv ──
  'mailtv.net',
  // ── mailzilla ──
  'mailzilla.com', 'mailzilla.org',
  // ── makemetheking ──
  'makemetheking.com',
  // ── manybrain ──
  'manybrain.com',
  // ── mbx.cc ──
  'mbx.cc',
  // ── mega.zik.dj ──
  // ── meinspamschutz ──
  'meinspamschutz.de',
  // ── meltmail ──
  'meltmail.com',
  // ── messagebeamer ──
  'messagebeamer.de',
  // ── mezimages ──
  'mezimages.net',
  // ── mindless.com ──
  // ── mintemail ──
  'mintemail.com',
  // ── mx0.wwwnew.eu ──
  'mx0.wwwnew.eu',
  // ── myfastmail ──
  'myfastmail.com',
  // ── mywarnmail ──
  'mywarnmail.com',
  // ── netzidiot ──
  'netzidiot.de',
  // ── nice-4u ──
  'nice-4u.com',
  // ── noblepioneer ──
  'noblepioneer.com',
  // ── nomail ──
  'nomail.pw',
  // ── nomo.nl ──
  'nomo.nl',
  // ── non.email ──
  'non.email',
  // ── nonspam ──
  'nonspam.eu',
  // ── nothingtoseehere ──
  'nothingtoseehere.ca',
  // ── notmailinator ──
  'notmailinator.com',
  // ── nowmymail ──
  'nowmymail.com', 'nowmymail.net',
  // ── obobbo ──
  'obobbo.com',
  // ── odaymail ──
  'odaymail.com',
  // ── oneoffmail ──
  'oneoffmail.com',
  // ── onewaymail ──
  'onewaymail.com',
  // ── onlatedotcom ──
  'onlatedotcom.info',
  // ── open-tmail ──
  'open-tmail.com',
  // ── ordinaryamerican ──
  'ordinaryamerican.net',
  // ── owlpic ──
  'owlpic.com',
  // ── pancakemail ──
  'pancakemail.com',
  // ── pjjkp ──
  'pjjkp.com',
  // ── plexolan ──
  'plexolan.de',
  // ── poofy ──
  'poofy.org',
  // ── pookmail ──
  'pookmail.com',
  // ── privacy.net ──
  'privacy.net',
  // ── proxymail ──
  'proxymail.eu',
  // ── prtnx ──
  'prtnx.com',
  // ── putthisinyourspamdatabase ──
  'putthisinyourspamdatabase.com',
  // ── qq.com (Chinese portal, can be abused) — legit, skip ──
  // ── quickinbox ──
  'quickinbox.com',
  // ── recode.me ──
  'recode.me',
  // ── recursor ──
  // ── rejectmail ──
  'rejectmail.com',
  // ── reqzone ──
  'reqzone.com',
  // ── rhyta ──
  'rhyta.com',
  // ── rklips ──
  'rklips.com',
  // ── rmqkr ──
  'rmqkr.net',
  // ── rofl.ie ──
  'rofl.ie',
  // ── royaldoodles ──
  // ── rumgel ──
  'rumgel.com',
  // ── ruu.pl ──
  'ruu.pl',
  // ── s0ny.net ──
  's0ny.net',
  // ── safe-mail ──
  // ── safetypost ──
  'safetypost.de',
  // ── send-email ──
  'send-email.org',
  // ── sendspamhere ──
  'sendspamhere.com',
  // ── senseless-entertainment ──
  'senseless-entertainment.com',
  // ── shortmail ──
  'shortmail.net',
  // ── shitmail ──
  'shitmail.de', 'shitmail.me', 'shitmail.org',
  // ── sify.com ──
  // ── silenceofweb ──
  'silenceofweb.com',
  // ── simpleitsecurity ──
  // ── sinfiltro ──
  'sinfiltro.cl',
  // ── skeefmail ──
  'skeefmail.com',
  // ── smellfear ──
  'smellfear.com',
  // ── snakemail ──
  'snakemail.com',
  // ── sneakemail ──
  'sneakemail.com',
  // ── sofort-mail ──
  'sofort-mail.de',
  // ── sogetthis ──
  'sogetthis.com',
  // ── soisz ──
  'soisz.com',
  // ── spam.la ──
  'spam.la',
  // ── spambob ──
  'spambob.com', 'spambob.net', 'spambob.org',
  // ── spamcero ──
  'spamcero.com',
  // ── spamcorptastic ──
  'spamcorptastic.com',
  // ── spamcowboy ──
  'spamcowboy.com', 'spamcowboy.net', 'spamcowboy.org',
  // ── spamday ──
  'spamday.com',
  // ── spamfree ──
  'spamfree.eu',
  // ── spamglobal ──
  'spamglobal.com',
  // ── spamgob ──
  'spamgob.com',
  // ── spamherelots ──
  'spamherelots.com',
  // ── spamhereplease ──
  // ── spamhole ──
  'spamhole.com',
  // ── spamify ──
  'spamify.com',
  // ── spaminmotion ──
  'spaminmotion.com',
  // ── spamkill ──
  'spamkill.info',
  // ── spaml.com ──
  'spaml.com', 'spaml.de',
  // ── spammotel ──
  'spammotel.com',
  // ── spamoff ──
  'spamoff.de',
  // ── spamspot ──
  'spamspot.com',
  // ── spamthisplease ──
  'spamthisplease.com',
  // ── spamtroll ──
  'spamtroll.net',
  // ── speed.1s.fr ──
  // ── spoofmail ──
  'spoofmail.de',
  // ── suremail ──
  'suremail.info',
  // ── sweetxxx ──
  'sweetxxx.de',
  // ── tafmail ──
  'tafmail.com',
  // ── tagyourself ──
  'tagyourself.com',
  // ── teewars ──
  'teewars.org',
  // ── teleworm ──
  'teleworm.com', 'teleworm.us',
  // ── tempalias ──
  'tempalias.com',
  // ── tempbmail ──
  'tempbmail.com',
  // ── tempemail ──
  'tempemail.biz', 'tempemail.com', 'tempemail.net',
  // ── tempthe ──
  'tempthe.net',
  // ── tgasa ──
  // ── thanksnospam ──
  'thanksnospam.info',
  // ── thisisnotmyrealemail ──
  'thisisnotmyrealemail.com',
  // ── thismail ──
  'thismail.net', 'thismail.ru',
  // ── throwam ──
  // ── tittbit ──
  'tittbit.in',
  // ── tmail.com ──
  'tmail.com', 'tmail.io',
  // ── tmailinator ──
  'tmailinator.com',
  // ── toiea ──
  'toiea.com',
  // ── tokenmail ──
  'tokenmail.de',
  // ── tomber / tomberia ──
  // ── topranklist ──
  'topranklist.de',
  // ── tradermail ──
  'tradermail.info',
  // ── trash2009 ──
  'trash2009.com',
  // ── trashdevil ──
  'trashdevil.com', 'trashdevil.de',
  // ── trashemail ──
  'trashemail.de',
  // ── trashimail ──
  'trashimail.de',
  // ── trashmail2 ──
  'trashmail2.com',
  // ── turual ──
  'turual.com',
  // ── twinmail ──
  'twinmail.de',
  // ── tyldd ──
  'tyldd.com',
  // ── uggsrock ──
  'uggsrock.com',
  // ── umail ──
  'umail.net',
  // ── unbounded ──
  'unbounded.com',
  // ── unids ──
  'unids.com',
  // ── uroid ──
  'uroid.com',
  // ── us.af ──
  'us.af',
  // ── usenetmail ──
  'usenetmail.tk',
  // ── valemail ──
  'valemail.net',
  // ── venompen ──
  'venompen.com',
  // ── viditag ──
  'viditag.com',
  // ── viewcastmedia ──
  'viewcastmedia.net', 'viewcastmedia.org',
  // ── vomoto ──
  'vomoto.com',
  // ── vpn.st ──
  'vpn.st',
  // ── waitfor ──
  'waitfor.me',
  // ── webemail ──
  'webemail.me',
  // ── webm4il ──
  'webm4il.info',
  // ── wegwerfadresse ──
  'wegwerfadresse.de',
  // ── wegwerfemail ──
  'wegwerfemail.de',
  // ── wegwerfmail ──
  'wegwerfmail.de', 'wegwerfmail.net', 'wegwerfmail.org',
  // ── wh4f ──
  'wh4f.org',
  // ── whatiaas ──
  'whatiaas.com',
  // ── whyspam ──
  'whyspam.eu', 'whyspam.me',
  // ── wikidocumentaries ──
  // ── willhackforfood ──
  'willhackforfood.biz',
  // ── wilemail ──
  'wilemail.com',
  // ── winmail ──
  // ── wmail ──
  'wmail.cf',
  // ── writeeme ──
  'writeeme.com',
  // ── wronghead ──
  'wronghead.com',
  // ── wuzupmail ──
  'wuzupmail.net',
  // ── www.com (fake) ──
  // ── xagloo ──
  'xagloo.com',
  // ── xemaps ──
  'xemaps.com',
  // ── xents ──
  'xents.com',
  // ── xmaily ──
  'xmaily.com',
  // ── xoxy ──
  'xoxy.net',
  // ── xyzfree ──
  'xyzfree.net',
  // ── yapped ──
  'yapped.net',
  // ── yeah.net ──
  // ── ycare ──
  'ycare.de',
  // ── yep.it ──
  'yep.it',
  // ── yogamaven ──
  'yogamaven.com',
  // ── yomail ──
  'yomail.info',
  // ── yuurok ──
  'yuurok.com',
  // ── z1p ──
  'z1p.biz',
  // ── zehnminutenmail ──
  'zehnminutenmail.de',
  // ── zippymail ──
  'zippymail.info',
  // ── zoemail ──
  'zoemail.net', 'zoemail.org',
  // ── zomg ──
  'zomg.info',
  // ── inboxalias / inbox.lv — inbox.lv is legit Latvian provider; skip ──
])

export function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase().trim()
  if (!domain) return false
  return DISPOSABLE_DOMAINS.has(domain)
}
