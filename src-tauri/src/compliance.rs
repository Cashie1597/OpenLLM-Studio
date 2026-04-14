pub struct ComplianceSuite {
    pub air_gapped_mode: bool,
}

impl ComplianceSuite {
    pub fn new() -> Self {
        Self {
            air_gapped_mode: false,
        }
    }

    pub fn toggle_air_gapped(&mut self, enabled: bool) {
        self.air_gapped_mode = enabled;
    }
}
