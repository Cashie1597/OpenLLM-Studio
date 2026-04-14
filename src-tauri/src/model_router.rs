pub struct ModelRouter;

impl ModelRouter {
    pub fn new() -> Self {
        Self
    }

    pub fn route_task(&self, _task: &str) -> String {
        "default-model".to_string()
    }
}
