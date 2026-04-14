use std::collections::VecDeque;

pub struct LoopDetector {
    recent_steps: VecDeque<String>,
    max_steps: usize,
}

impl LoopDetector {
    pub fn new() -> Self {
        Self {
            recent_steps: VecDeque::new(),
            max_steps: 10,
        }
    }

    pub fn add_step(&mut self, step: String) -> bool {
        self.recent_steps.push_back(step.clone());
        if self.recent_steps.len() > self.max_steps {
            self.recent_steps.pop_front();
        }

        let count = self.recent_steps.iter().filter(|s| *s == &step).count();
        count >= 3
    }

    pub fn reset(&mut self) {
        self.recent_steps.clear();
    }
}
