"use client";
import { SITE } from "@/lib/data";
import { useLang } from "@/lib/i18n";
import { DemoBanner, PageHead, SubmitRow, useSubmit } from "@/components/ui";
import { Icon } from "@/components/Icon";

export default function Contact() {
  const { lang, t } = useLang();
  const { state, onSubmit } = useSubmit("messages");
  const az = lang === "az";
  return (
    <>
      <PageHead eyebrow={t("contact")} title={az ? "Bizə yaz" : "Get in touch"} lead={az ? "Tərəfdaşlıq, sponsorluq, mentorluq və ya sual üçün." : "For partnerships, sponsorship, mentoring or questions."} />
      <DemoBanner />
      <div className="cols">
        <form className="panel box form" onSubmit={onSubmit}>
          <div className="grid2">
            <div className="field-row"><label htmlFor="c-name">{az ? "Ad" : "Name"}</label><input className="input" id="c-name" name="name" required /></div>
            <div className="field-row"><label htmlFor="c-email">E-poçt</label><input className="input" id="c-email" name="email" type="email" required /></div>
          </div>
          <div className="field-row"><label htmlFor="c-topic">{az ? "Mövzu" : "Topic"}</label>
            <select className="input" id="c-topic" name="topic">{(az ? ["Sual", "Tərəfdaşlıq", "Sponsorluq", "Mentor olmaq", "Digər"] : ["Question", "Partnership", "Sponsorship", "Become a mentor", "Other"]).map((x) => <option key={x}>{x}</option>)}</select></div>
          <div className="field-row"><label htmlFor="c-msg">{az ? "Mesaj" : "Message"}</label><textarea className="input" id="c-msg" name="message" required /></div>
          <SubmitRow state={state} />
        </form>
        <div className="panel box stack">
          <h3>{az ? "Birbaşa əlaqə" : "Direct"}</h3>
          <div className="list">
            {SITE.email && <div className="row"><Icon name="mail" size={20} /><div className="grow"><b style={{ userSelect: "all" }}>{SITE.email}</b><span>E-poçt</span></div></div>}
            {SITE.whatsapp && <a className="row" href={SITE.whatsapp} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}><Icon name="chat" size={20} /><div className="grow"><b>WhatsApp</b><span>{az ? "İcma qrupuna qoşul" : "Join the community group"}</span></div></a>}
            {SITE.instagram && <a className="row" href={SITE.instagram} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}><Icon name="image" size={20} /><div className="grow"><b>Instagram</b><span>{SITE.handle}</span></div></a>}
            {SITE.linkedin && <a className="row" href={SITE.linkedin} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}><Icon name="brief" size={20} /><div className="grow"><b>LinkedIn</b></div></a>}
            {SITE.linktree && <a className="row" href={SITE.linktree} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}><Icon name="link" size={20} /><div className="grow"><b>Linktree</b><br /><span className="muted">Bütün linklər bir yerdə</span></div></a>}
            {SITE.tiktok && <a className="row" href={SITE.tiktok} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}><Icon name="spark" size={20} /><div className="grow"><b>TikTok</b><span>{SITE.handle}</span></div></a>}
            <div className="row"><Icon name="pin" size={20} /><div className="grow"><b>{az ? "Bakı Mühəndislik Universiteti" : "Baku Engineering University"}</b></div></div>
          </div>
        </div>
      </div>
    </>
  );
}
