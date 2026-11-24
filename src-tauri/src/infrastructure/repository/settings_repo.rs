use rusqlite::{params, Connection, Result};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

pub trait SettingsRepository {
    fn set(&self, key: &str, value: &str) -> Result<()>;
    fn get(&self, key: &str) -> Result<Option<String>>;
    fn get_all(&self) -> Result<HashMap<String, String>>;
    fn clear(&self) -> Result<()>;
}

pub struct SqliteSettingsRepository {
    conn: Arc<Mutex<Connection>>,
}

impl SqliteSettingsRepository {
    pub fn new(conn: Arc<Mutex<Connection>>) -> Self {
        Self { conn }
    }

    pub fn get_raw(conn: &Connection, key: &str) -> Result<Option<String>> {
        let mut stmt = conn.prepare("SELECT value FROM settings WHERE key = ?")?;
        let mut rows = stmt.query(params![key])?;

        if let Some(row) = rows.next()? {
            Ok(Some(row.get(0)?))
        } else {
            Ok(None)
        }
    }
}

impl SettingsRepository for SqliteSettingsRepository {
    fn set(&self, key: &str, value: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
            params![key, value],
        )?;
        Ok(())
    }

    fn get(&self, key: &str) -> Result<Option<String>> {
        let conn = self.conn.lock().unwrap();
        Self::get_raw(&conn, key)
    }

    fn get_all(&self) -> Result<HashMap<String, String>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT key, value FROM settings")?;
        let rows = stmt.query_map([], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
        })?;

        let mut settings = HashMap::new();
        for row in rows {
            let (key, value) = row?;
            settings.insert(key, value);
        }
        Ok(settings)
    }

    fn clear(&self) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM settings", [])?;
        Ok(())
    }
}
