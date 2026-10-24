import { useState } from 'react';
import { FeedbackView } from './components/FeedbackView';
import { Home } from './components/Home';
import { Practice } from './components/Practice';
import { Setup } from './components/Setup';
import { demoCoach } from './lib/coach';
import { analyse, type Turn } from './lib/feedback';
import { CUSTOM_ID, customScenario, SCENARIOS, type Difficulty, type Scenario } from './lib/scenarios';
import { uid, useSaved, type Session } from './lib/store';

type Screen =
  | { name: 'home' }
  | { name: 'setup'; scenario: Scenario | null }
  | { name: 'practice'; scenario: Scenario; difficulty: Difficulty; custom?: { who: string; goal: string }; key: number }
  | { name: 'feedback'; scenario: Scenario; session: Session };

function scenarioFor(session: Session): Scenario {
  if (session.scenarioId === CUSTOM_ID) return customScenario(session.custom?.who ?? '', session.custom?.goal ?? '');
  return SCENARIOS.find((s) => s.id === session.scenarioId) ?? customScenario('', session.title);
}

export default function App() {
  const { sessions, settings, addSession, clearSessions, setSettings } = useSaved();
  const [screen, setScreen] = useState<Screen>({ name: 'home' });
  const home = () => setScreen({ name: 'home' });

  switch (screen.name) {
    case 'home':
      return (
        <Home
          sessions={sessions}
          onPick={(scenario) => setScreen({ name: 'setup', scenario })}
          onCustom={() => setScreen({ name: 'setup', scenario: null })}
          onReview={(session) => setScreen({ name: 'feedback', scenario: scenarioFor(session), session })}
          onClear={clearSessions}
        />
      );

    case 'setup':
      return (
        <Setup
          scenario={screen.scenario}
          settings={settings}
          onSettings={setSettings}
          onStart={(scenario, difficulty, custom) =>
            setScreen({ name: 'practice', scenario, difficulty, custom, key: Date.now() })
          }
          onBack={home}
        />
      );

    case 'practice': {
      const { scenario, difficulty, custom } = screen;
      const finish = (turns: Turn[]) => {
        const session: Session = {
          id: uid(),
          scenarioId: scenario.id,
          title: scenario.title,
          emoji: scenario.emoji,
          difficulty,
          date: Date.now(),
          turns,
          score: analyse(turns, scenario).score,
          custom,
        };
        addSession(session);
        setScreen({ name: 'feedback', scenario, session });
      };
      return (
        <Practice
          key={screen.key}
          scenario={scenario}
          difficulty={difficulty}
          coach={demoCoach}
          voiceReplies={settings.voiceReplies}
          onFinish={finish}
          onQuit={home}
        />
      );
    }

    case 'feedback': {
      const { scenario, session } = screen;
      return (
        <FeedbackView
          scenario={scenario}
          feedback={analyse(session.turns, scenario)}
          turns={session.turns}
          onHome={home}
          onRetry={() =>
            setScreen({
              name: 'practice',
              scenario,
              difficulty: session.difficulty,
              custom: session.custom,
              key: Date.now(),
            })
          }
        />
      );
    }
  }
}
