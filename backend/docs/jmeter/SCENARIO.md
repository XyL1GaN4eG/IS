# Apache JMeter Scenario

## Общая идея
- Используем один Test Plan c параметрами (их можно переопределять через `-J...`):
  - `baseProtocol` (по умолчанию `http`)
  - `baseHost` (по умолчанию `localhost`)
  - `basePort` (по умолчанию `43261`)
- HTTP Request Defaults настраивают протокол/хост/порт.
- Все запросы передают заголовки `X-User`/`X-Role` (эмулируем авторизацию, как в UI).

## Структура плана
1. **setUp Thread Group (`Seed Data`)**
    - POST `/persons` (администратор) создаёт запись и сохраняет `seedPersonId` в свойствах JMeter.
    - Инициализирует параметры гонки уникальности (`racePersonName`, счётчики успехов/ошибок).
2. **Thread Group (`ConcurrentOps`)** – 2 администратора параллельно обновляют/удаляют один и тот же объект:
    - PUT `/persons/${seedPersonId}`
    - DELETE `/persons/${seedPersonId}`
    - 404 при гонке считается ожидаемым результатом.
3. **Thread Group (`UniqueNameRace`)** – 5 пользователей одновременно создают объект с одним и тем же `name`:
    - POST `/persons` (одно создание должно пройти, остальные — вернуть ошибку уникальности).
4. **Thread Group (`RegularUsers`)** – 3 потока по последовательности:
    - POST `/persons` (создать уникального персонажа).
    - PUT `/persons/{id}` (изменить атрибуты).
    - DELETE `/persons/{id}`.
    - POST `/persons/import` (multipart с YAML).
5. **Thread Group (`Admins`)** – 1 поток:
    - GET `/persons` (просмотр).
    - POST `/location/import`.
    - GET `/location/imports?scope=all` (история).
6. **tearDown Thread Group (`Assertions`)**
    - Проверяет, что в гонке уникальности было ровно 1 успешное создание.

## Импорт
- Для повторяемости сценарий генерирует временные YAML-файлы перед запросом импорта в `${java.io.tmpdir}/is-jmeter/`.
- Для запуска из CLI:
  ```bash
  docker compose up -d --build
  jmeter -n \
    -t backend/docs/jmeter/ImportScenario.jmx \
    -JbaseProtocol=http \
    -JbaseHost=localhost \
    -JbasePort=43261 \
    -l /tmp/is-jmeter-results.jtl
  ```
- Сценарий покрывает создание/редактирование/удаление/импорт, конкурентный update/delete и гонку на уникальность.
