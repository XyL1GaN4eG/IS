# Grafana k6 scenario (CRUD + Import + Concurrency)

Сценарий проверяет корректность поведения ИС при одновременной работе нескольких пользователей:
- CRUD (создание/редактирование/удаление) для `Person`
- импорт `Person` и `Location` (multipart + YAML)
- конфликтные операции: `update+delete`, `delete+delete` одного и того же объекта
- проверка программного ограничения уникальности (одновременное создание `Person` с одинаковым `name`)

## Предусловия
- backend доступен по `BASE_URL` (по умолчанию `http://localhost:43261`)
- для импорта поднят MinIO и настроены переменные окружения backend (как в `docker-compose.yml`)

## Запуск через Docker
```bash
docker run --rm -i \
  -v "$PWD":/work -w /work \
  grafana/k6 run \
  -e BASE_URL=http://host.docker.internal:43261 \
  backend/docs/k6/scenario.js
```
На Linux может потребоваться добавить хост:
`docker run ... --add-host=host.docker.internal:host-gateway ...`

Если запускаете k6 не в Docker, а локально (установленный `k6`), используйте:
```bash
k6 run -e BASE_URL=http://localhost:43261 backend/docs/k6/scenario.js
```

Скрипт перед стартом сценариев ожидает готовность backend (по умолчанию до 60 секунд). Настройки ожидания:
- `READY_TIMEOUT_SEC` (по умолчанию `60`)
- `READY_INTERVAL_SEC` (по умолчанию `0.5`)
- `READY_PATH` (по умолчанию `/persons?page=0&size=1`)

Параметры нагрузки (опционально):
- `CRUD_VUS` (по умолчанию `5`)
- `CRUD_ITERS` (по умолчанию `2`)
- `CONFLICT_ITERS` (по умолчанию `10`)
- `UNIQUE_ITERS` (по умолчанию `10`)

Пример:
```bash
docker run --rm -i \
  -v "$PWD":/work -w /work \
  grafana/k6 run \
  -e BASE_URL=http://host.docker.internal:43261 \
  -e CRUD_VUS=10 -e CRUD_ITERS=3 \
  -e CONFLICT_ITERS=30 -e UNIQUE_ITERS=30 \
  backend/docs/k6/scenario.js
```

## Ожидаемое поведение (проверяется `check(...)`)
- `unique_name_race`: ровно один запрос `POST /persons` получает `200`, второй — `400`; после удаления “победителя” `/persons/check-name` возвращает `available=true` (значит, дублей не осталось).
- `conflict_delete_delete`: один `DELETE` возвращает `200`, второй — `404`.
- `conflict_update_delete`: итоговое чтение `GET /persons/{id}` после конфликтной пары возвращает `404` (объект удалён); при этом в конфликте допустимы статусы `200/404/409` для `PUT` и `200/404` для `DELETE` (без `5xx`).
> Важно: ожидаемые `400/404` могут увеличивать метрику `http_req_failed` в выводе k6; ориентируйтесь на `checks_succeeded`.

## Изоляция транзакций (обоснование изменения)
- По умолчанию используется `READ_COMMITTED` (см. `backend/src/main/resources/application.yml`): при программной проверке уникальности (без `UNIQUE` в БД) важно видеть актуальные коммиты других транзакций; в `REPEATABLE_READ` (snapshot isolation) длинная транзакция (например, импорт) может читать “старый снимок” и пропускать дубликаты.
- Корректность уникальности обеспечивается сочетанием `READ_COMMITTED` + `pg_advisory_xact_lock(...)` на значение `name`.
- Для конфликтов `update/delete` одного объекта используется пессимистическая блокировка строки (чтобы исключить `5xx` из‑за “stale update” при конкурентном удалении).
