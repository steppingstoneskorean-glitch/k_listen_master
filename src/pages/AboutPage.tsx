const ADMIN_EMAIL = 'steppingstoneskorean@gmail.com'

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 flex flex-col gap-8 text-gray-300">
      <div>
        <h1 className="text-2xl font-black text-white">About Step Korean</h1>
        <p className="text-xs text-gray-600 mt-2">
          Learn real Korean with K-pop — one sentence at a time.
        </p>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold text-white">What is K-Listen Master?</h2>
        <p className="text-sm leading-relaxed text-gray-400">
          K-Listen Master is a free Korean listening practice service built around real K-pop live
          videos and carefully recorded native audio. Instead of textbook dialogues, you train your
          ears on the Korean that idols and native speakers actually use — fast, natural, and full of
          the grammar and expressions you will hear in real life.
        </p>
        <p className="text-sm leading-relaxed text-gray-400">
          Every quiz is designed by a veteran Korean teacher. You loop a short segment, catch what
          was said, fill in the blank, and get an explanation of the grammar and vocabulary behind
          it. Minimal-pair listening drills (거울/겨울, 사람/사랑…) sharpen the sound distinctions
          that trip up most learners.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold text-white">What you can do here</h2>
        <ul className="list-disc list-inside text-sm leading-relaxed text-gray-400 pl-2 flex flex-col gap-1">
          <li>K-Artist Live quizzes — dictation and comprehension questions on real K-pop live clips</li>
          <li>Listening games — minimal-pair sound training with native-recorded audio</li>
          <li>Dictation practice — intermediate and advanced sentence dictation with leaderboards</li>
          <li>Error review — your missed words are tracked on your device so you can review them</li>
          <li>Free materials — study resources curated by the teacher</li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold text-white">Who runs this?</h2>
        <p className="text-sm leading-relaxed text-gray-400">
          Step Korean is run by a professional Korean language teacher with years of experience
          teaching global learners. The audio drills are recorded and edited in-house, and every
          quiz is reviewed by the teacher before it is published. K-pop videos are embedded via the
          official YouTube player and remain the property of their respective rights holders.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold text-white">Contact</h2>
        <p className="text-sm leading-relaxed text-gray-400">
          Questions, feedback, corrections, or data requests — email us anytime:
        </p>
        <a
          href={`mailto:${ADMIN_EMAIL}`}
          className="text-indigo-400 hover:text-indigo-300 underline text-sm w-fit"
        >
          {ADMIN_EMAIL}
        </a>
        <p className="text-sm leading-relaxed text-gray-400">
          You can also find us on{' '}
          <a
            href="https://www.youtube.com/@steppingstones.Korean"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-300 underline"
          >
            YouTube
          </a>
          .
        </p>
      </section>
    </div>
  )
}
