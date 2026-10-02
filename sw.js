// Service worker: кеширует страницу целиком, чтобы тренажёр открывался БЕЗ интернета.
// Вся страница самодостаточна (вопросы вшиты внутрь), поэтому кешировать нужно её одну.
// Версия меняется при каждой публикации — иначе телефон покажет старые вопросы.
const CACHE = 'anatomy-trainer-v3';
const FILES = ['./', './index.html', './manifest.webmanifest'];

self.addEventListener('install', function (e) {
  // ставим новую версию сразу, не дожидаясь закрытия старых вкладок
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }));
});

self.addEventListener('activate', function (e) {
  // подчищаем кеши прошлых версий
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        return k === CACHE ? null : caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  // Сеть в приоритете: так свежие вопросы подхватываются сами.
  // Нет сети — отдаём из кеша, тренажёр работает офлайн.
  e.respondWith(
    fetch(e.request).then(function (resp) {
      const copy = resp.clone();
      caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
      return resp;
    }).catch(function () {
      return caches.match(e.request).then(function (hit) {
        return hit || caches.match('./index.html');
      });
    })
  );
});
