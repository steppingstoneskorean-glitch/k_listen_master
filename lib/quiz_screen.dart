import 'package:flutter/material.dart';

// ── Data ─────────────────────────────────────────────────────────────────────

class _Option {
  final String word;
  final String meaning;
  final bool correct;
  const _Option(this.word, this.meaning, this.correct);
}

class _Question {
  final String spoken;
  final List<_Option> options;
  final String tip;
  const _Question(this.spoken, this.options, this.tip);
}

const _questions = [
  _Question('불', [
    _Option('불', 'Fire 🔥', true),
    _Option('뿔', 'Horn 🦄', false),
  ], 'ㅂ(유성음) vs ㅃ(경음) — 성대 긴장도의 차이예요.'),
  _Question('쌀', [
    _Option('살', 'Skin 🦵', false),
    _Option('쌀', 'Rice 🌾', true),
  ], 'ㅅ(평음) vs ㅆ(경음) — 기식량의 차이를 느껴보세요.'),
  _Question('달', [
    _Option('달', 'Moon 🌙', true),
    _Option('탈', 'Mask 🎭', false),
  ], 'ㄷ(무기음) vs ㅌ(유기음) — ㅌ 발음 시 바람이 나와요!'),
  _Question('구름', [
    _Option('구름', 'Cloud ☁️', true),
    _Option('그림', 'Picture 🖼️', false),
  ], 'ㅜ vs ㅡ — 입 모양이 핵심이에요.'),
  _Question('밥', [
    _Option('밤', 'Night 🌃', false),
    _Option('밥', 'Rice 🍚', true),
  ], 'ㅁ(nasal) vs ㅂ(stop) — 받침 끝내는 방식이 달라요.'),
];

const _maxLives = 3;

// ── Screen ────────────────────────────────────────────────────────────────────

class QuizScreen extends StatefulWidget {
  const QuizScreen({super.key});

  @override
  State<QuizScreen> createState() => _QuizScreenState();
}

class _QuizScreenState extends State<QuizScreen>
    with SingleTickerProviderStateMixin {
  int _index = 0;
  int _score = 0;
  int _lives = _maxLives;
  // 'idle' | 'correct' | 'wrong'
  String _feedback = 'idle';
  bool _gameOver = false;
  bool _cleared = false;
  late AnimationController _shakeCtrl;
  late Animation<double> _shakeAnim;

  @override
  void initState() {
    super.initState();
    _shakeCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );
    _shakeAnim = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _shakeCtrl, curve: Curves.elasticIn),
    );
  }

  @override
  void dispose() {
    _shakeCtrl.dispose();
    super.dispose();
  }

  void _answer(_Option option) {
    if (_feedback != 'idle') return;

    if (option.correct) {
      setState(() {
        _score += 100;
        _feedback = 'correct';
      });
      Future.delayed(const Duration(milliseconds: 900), _next);
    } else {
      setState(() {
        _lives -= 1;
        _feedback = 'wrong';
      });
      _shakeCtrl.forward(from: 0);
      Future.delayed(const Duration(milliseconds: 1400), _next);
    }
  }

  void _next() {
    if (!mounted) return;

    if (_lives <= 0) {
      setState(() => _gameOver = true);
      return;
    }

    if (_index + 1 >= _questions.length) {
      setState(() => _cleared = true);
      return;
    }

    setState(() {
      _index += 1;
      _feedback = 'idle';
    });
  }

  void _restart() {
    setState(() {
      _index = 0;
      _score = 0;
      _lives = _maxLives;
      _feedback = 'idle';
      _gameOver = false;
      _cleared = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_gameOver || _cleared) return _buildResult();
    return _buildGame();
  }

  // ── Game UI ────────────────────────────────────────────────────────────────

  Widget _buildGame() {
    final q = _questions[_index];
    final progress = (_index / _questions.length);

    return Scaffold(
      backgroundColor: const Color(0xFF0F0F1A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F0F1A),
        foregroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
          onPressed: () => Navigator.pop(context),
        ),
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            for (int i = 0; i < _maxLives; i++)
              Padding(
                padding: const EdgeInsets.only(right: 2),
                child: Icon(
                  Icons.favorite_rounded,
                  size: 18,
                  color: i < _lives
                      ? const Color(0xFFEF5350)
                      : Colors.white12,
                ),
              ),
          ],
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 16, top: 8, bottom: 8),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.white10,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text('⚡', style: TextStyle(fontSize: 14)),
                const SizedBox(width: 4),
                Text(
                  _score.toString(),
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(3),
          child: LinearProgressIndicator(
            value: progress,
            backgroundColor: Colors.white10,
            valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF7C4DFF)),
            minHeight: 3,
          ),
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          child: Column(
            children: [
              Text(
                '${_index + 1} / ${_questions.length}',
                style: const TextStyle(color: Colors.white38, fontSize: 12),
              ),
              const SizedBox(height: 32),

              // ── Spoken word display (simulates audio) ──
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 40),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.06),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: Colors.white10),
                ),
                child: Column(
                  children: [
                    const Text(
                      '들리는 단어를 선택하세요',
                      style: TextStyle(color: Colors.white38, fontSize: 12),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      q.spoken,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 64,
                        fontWeight: FontWeight.w900,
                        letterSpacing: -2,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // ── Feedback tip on wrong ──
              AnimatedOpacity(
                opacity: _feedback == 'wrong' ? 1.0 : 0.0,
                duration: const Duration(milliseconds: 300),
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF2A1A1A),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.red.shade900),
                  ),
                  child: Text(
                    q.tip,
                    style: const TextStyle(
                      color: Color(0xFFFFAB91),
                      fontSize: 12,
                      height: 1.5,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
              if (_feedback == 'wrong') const SizedBox(height: 12),

              const Spacer(),

              // ── Answer Cards ──
              AnimatedBuilder(
                animation: _shakeAnim,
                builder: (context, child) {
                  final offset =
                      _feedback == 'wrong' && _shakeCtrl.isAnimating
                          ? 8 * (1 - _shakeAnim.value) * (_shakeAnim.value % 0.2 < 0.1 ? 1 : -1)
                          : 0.0;
                  return Transform.translate(
                    offset: Offset(offset, 0),
                    child: child,
                  );
                },
                child: Column(
                  children: q.options.map((option) {
                    Color borderColor = const Color(0xFF2A2A3A);
                    Color bgColor = const Color(0xFF1A1A2E);
                    Color textColor = Colors.white;

                    if (_feedback != 'idle') {
                      if (option.correct) {
                        borderColor = const Color(0xFF4CAF50);
                        bgColor = const Color(0xFF1B3A1D);
                        textColor = const Color(0xFF81C784);
                      } else {
                        borderColor = Colors.red.shade900;
                        bgColor = const Color(0xFF2A1A1A);
                        textColor = Colors.white30;
                      }
                    }

                    return GestureDetector(
                      onTap: () => _answer(option),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 250),
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.symmetric(
                            vertical: 22, horizontal: 20),
                        decoration: BoxDecoration(
                          color: bgColor,
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(color: borderColor, width: 1.5),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              option.word,
                              style: TextStyle(
                                color: textColor,
                                fontSize: 36,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Text(
                              option.meaning,
                              style: TextStyle(
                                color: textColor.withOpacity(0.7),
                                fontSize: 14,
                              ),
                            ),
                            if (_feedback != 'idle' && option.correct) ...[
                              const Spacer(),
                              const Icon(Icons.check_circle_rounded,
                                  color: Color(0xFF4CAF50), size: 22),
                            ],
                          ],
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),

              if (_feedback == 'correct')
                const Padding(
                  padding: EdgeInsets.only(bottom: 8),
                  child: Text(
                    '✨  정확해요!',
                    style: TextStyle(
                      color: Color(0xFF81C784),
                      fontWeight: FontWeight.bold,
                      fontSize: 15,
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  // ── Result UI ──────────────────────────────────────────────────────────────

  Widget _buildResult() {
    final success = _cleared;
    return Scaffold(
      backgroundColor: const Color(0xFF0F0F1A),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                success ? '🏆' : '💔',
                style: const TextStyle(fontSize: 72),
              ),
              const SizedBox(height: 16),
              Text(
                success ? '클리어!' : '게임 오버',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 32,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                success
                    ? '모든 발음 문제를 완료했어요!'
                    : '목숨을 모두 소진했습니다.',
                style: const TextStyle(color: Colors.white38, fontSize: 14),
              ),
              const SizedBox(height: 32),
              Container(
                padding: const EdgeInsets.symmetric(
                    vertical: 20, horizontal: 40),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.06),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.white10),
                ),
                child: Column(
                  children: [
                    const Text(
                      '최종 점수',
                      style:
                          TextStyle(color: Colors.white38, fontSize: 13),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      '$_score',
                      style: const TextStyle(
                        color: Color(0xFFFFD54F),
                        fontSize: 52,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 40),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: _restart,
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFF7C4DFF),
                    padding: const EdgeInsets.symmetric(vertical: 18),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  child: const Text(
                    '🔄  다시 도전하기',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: () => Navigator.pop(context),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white60,
                    side: const BorderSide(color: Colors.white12),
                    padding: const EdgeInsets.symmetric(vertical: 18),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  child: const Text(
                    '홈으로 돌아가기',
                    style: TextStyle(fontSize: 15),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
