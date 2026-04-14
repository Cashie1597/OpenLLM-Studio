pub struct TelemetryController {
    pub enabled: bool,
}

impl TelemetryController {
    pub fn new() -> Self {
        Self { enabled: false }
    }

    pub fn toggle(&mut self, enabled: bool) {
        self.enabled = enabled;
    }
}
