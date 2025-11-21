# Apache JMeter Scenario

## Общая идея
- Используем один Test Plan c переменными:
  - `baseUrl` (по умолчанию `http://localhost:43261`)
  - `personsFile` → `backend/docs/jmeter/samples/persons-import.yaml`
  - `locationsFile` → `backend/docs/jmeter/samples/locations-import.yaml`
- HTTP Request Defaults настраивают хост/порт.
- Все запросы передают заголовки `X-User`/`X-Role` (эмулируем авторизацию, как в UI).

## Структура плана
1. **setUp Thread Group (`Seed`)**
    - POST `/persons` (администратор) создаёт запись и сохраняет `seedPersonId` в свойствах JMeter.
2. **Thread Group (`ConcurrentOps`)** – 2 пользователя одновременно пытаются обновить и удалить этот объект:
    - PUT `/persons/${seedPersonId}` → проверяем поведение при параллельных апдейтах.
    - DELETE `/persons/${seedPersonId}` → один из потоков должен получить ошибку (объект уже удалён).
3. **Thread Group (`RegularUsers`)** – 3 потока по последовательности:
    - POST `/persons` (создать уникального персонажа).
    - PUT `/persons/{id}` (изменить атрибуты).
    - DELETE `/persons/{id}`.
    - POST `/persons/import` (multipart с YAML).
4. **Thread Group (`Admins`)** – 1 поток:
    - GET `/persons` (просмотр).
    - POST `/location/import`.
    - GET `/location/imports?scope=all` (история).

## Импорт
- Файлы лежат в `backend/docs/jmeter/samples/`.
- Для запуска из CLI:
  ```bash
  jmeter -n \
    -t backend/docs/jmeter/ImportScenario.jmx \
    -JbaseProtocol=http \
    -JbaseHost=localhost \
    -JbasePort=43261 \
    -JpersonsFile=$(pwd)/backend/docs/jmeter/samples/persons-import.yaml \
    -JlocationsFile=$(pwd)/backend/docs/jmeter/samples/locations-import.yaml \
    -l backend/docs/jmeter/results.jtl
  ```
- Сценарий покрывает создание/редактирование/удаление/импорт и конкурентные операции.
