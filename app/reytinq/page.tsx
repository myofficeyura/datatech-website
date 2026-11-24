"use client";
import { POINTS } from "@/lib/data";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { firebaseEnabled } from "@/lib/firebase";
import { LbRows, PageHead, useLeaderboard } from "@/components/ui";

export default function Rating() {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const rows = useLeaderboard(50);
  const az = lang === "az";
  const rules: [string, number][] = [
    [az ? "Tədbirdə iştirak" : "Attend an event", POINTS.eventAttend], [az ? "Hackathon" : "Hackathon", POINTS.hackathon],
    [az ? "Layihə təqdim et" : "Submit a project", POINTS.projectSubmit], [az ? "Qeydiyyat" : "Sign up", POINTS.signup],
    [az ? "Dost dəvət et" : "Invite a friend", POINTS.invite], [az ? "Tədbirə yazıl" : "Register for an event", POINTS.eventRegister],
    [az ? "Rəy formu" : "Feedback form", POINTS.feedback], [az ? "Quizdə düz cavab" : "Correct quiz answer", POINTS.quizCorrect],
    [az ? "Həftəlik qrup aktivliyi" : "Weekly group activity", POINTS.groupMessageWeek],
  ];
  return (
    <>
      <PageHead eyebrow={t("rating")} title={az ? "Ayın ən aktivləri" : "Most active this month"}
        lead={az ? "Xallar qrup aktivliyi, formalar və tədbirlərə görə hesablanır. Ayın birincisi mükafat qazanır." : "Points come from group activity, forms and events. The monthly leader wins a reward."} />
      {!firebaseEnabled && <div className="banner">{az ? "Nümunə data göstərilir." : "Showing sample data."}</div>}
      <div className="cols">
        <div className="panel box">{rows ? <LbRows rows={rows} meId={user?.uid} /> : <p className="note">{t("loading")}</p>}</div>
        <div className="panel box">
          <h3>{az ? "Xal qaydaları" : "How points work"}</h3>
          <div className="list">{rules.map(([k, v]) => <div key={k} className="row"><div className="grow"><b>{k}</b></div><span className="pts">+{v}</span></div>)}</div>
        </div>
      </div>
    </>
  );
}
