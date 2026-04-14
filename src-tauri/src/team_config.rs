pub struct TeamConfigManager;

impl TeamConfigManager {
    pub fn new() -> Self {
        Self
    }

    pub fn export_config(&self) -> Result<Vec<u8>, String> {
        Ok(vec![])
    }

    pub fn import_config(&self, _data: Vec<u8>) -> Result<(), String> {
        Ok(())
    }
}
