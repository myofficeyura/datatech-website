"use client";
import { useEffect, useState } from "react";
import { QUIZ, POINTS } from "@/lib/data";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { getRecord, setRecord } from "@/lib/store";
import { PageHead, SignInGate } from "@/components/ui";

function Quiz() {
  const { tr, lang } = useLang();
  const { user } = useAuth();
  const [ans, setAns] = useState<number[]>(Array(QUIZ.questions.length).fill(-1));
  const [done, setDone] = useState<number | null>(null);
  const id = `${QUIZ.week}_${user?.uid}`;
  useEffect(() => {
    getRecord("quizAnswers", id).then((r) => { if (r) { setAns(r.answers as number[]); setDone(Number(r.score)); } }).catch(() => {});
  }, [id]);
  const az = lang === "az";
  const submit = async () => {
    const score = ans.reduce((s, a, i) => s + (a === QUIZ.questions[i].answer ? 1 : 0), 0);
    setDone(score);
    try { await setRecord("quizAnswers", id, { uid: user?.uid, week: QUIZ.week, answers: ans, score }); } catch {}
  };
  return (
    <div className="stack" style={{ maxWidth: 760 }}>
      {QUIZ.questions.map((q, qi) => (
        <div key={qi} className="panel box stack">
          <b style={{ fontSize: 16 }}>{qi + 1}. {tr(q.q)}</b>
          {q.options.map((o, oi) => {
            let cls = "qopt";
            if (done !== null) { if (oi === q.answer) cls += " right"; else if (ans[qi] === oi) cls += " wrong"; }
            else if (ans[qi] === oi) cls += " sel";
            return (
              <label key={oi} className={cls}>
                <input type="radio" name={`q${qi}`} checked={ans[qi] === oi} disabled={done !== null} onChange={() => setAns(ans.map((a, i) => (i === qi ? oi : a)))} />
                <span>{o}</span>
              </label>
            );
          })}
        </div>
      ))}
      {done === null ? (
        <button className="btn pri" type="button" disabled={ans.includes(-1)} onClick={submit} style={{ alignSelf: "flex-start" }}>{az ? "Cavabları göndər" : "Submit answers"}</button>
      ) : (
        <div className="panel box"><b style={{ fontSize: 20 }}>{done} / {QUIZ.questions.length}</b><p className="muted">{az ? `Hər düz cavab +${POINTS.quizCorrect} xal. Xallar həftə sonu əlavə olunur. Növbəti quiz bazar ertəsi.` : `+${POINTS.quizCorrect} points per correct answer, added at the end of the week. Next quiz on Monday.`}</p></div>
      )}
    </div>
  );
}

export default function Page() {
  const { t, lang } = useLang();
  return (
    <>
      <PageHead eyebrow={t("quiz")} title={lang === "az" ? "Bu həftənin quizi" : "This week's quiz"} lead={lang === "az" ? "5 sual, data və AI əsasları. Hər həftə yenilənir." : "5 questions on data and AI basics. New every week."} />
      <SignInGate><Quiz /></SignInGate>
    </>
  );
}
