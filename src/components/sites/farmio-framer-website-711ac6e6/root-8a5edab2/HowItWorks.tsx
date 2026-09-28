import { HOW_IT_WORKS } from "../shared/content";
import { SectionTag } from "../shared/SectionTag";
import { WordReveal } from "../shared/WordReveal";

export function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-title" className="bg-farm-mist px-5 py-[60px] md:px-[30px] md:py-20 desk:py-[120px]">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-10 md:gap-[46px] desk:gap-[52px]">
        <div className="flex flex-col items-center gap-4 text-center desk:gap-5">
          <SectionTag>{HOW_IT_WORKS.tag}</SectionTag>
          <WordReveal id="how-title" className="fm-h2 max-w-[625px] text-farm-ink">
            {HOW_IT_WORKS.title}
          </WordReveal>
        </div>

        <ol className="grid gap-6 md:grid-cols-2 desk:grid-cols-3">
          {HOW_IT_WORKS.steps.map((s) => (
            <li key={s.step} className="flex flex-col gap-[100px] rounded-2xl bg-farm-sand p-5 desk:h-[454px] desk:justify-between desk:gap-0 desk:rounded-[20px] desk:p-6">
              <p className="fm-h3 text-farm-ink">{s.step}</p>
              <div className="flex flex-col gap-5 rounded-2xl bg-white p-6">
                <h3 className="fm-h5 text-farm-ink">{s.title}</h3>
                <p className="fm-p16 text-balance text-farm-body">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
