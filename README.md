# kirmy.org Pages

Static source for kirmy.org. The root page and the `test/` pages use plain HTML, CSS, and JavaScript.

## Preview

```sh
python3 -m http.server 8080
```

Open http://localhost:8080/. The GitHub Pages workflow is in `.github/workflows/pages.yml`; `CNAME` configures the custom domain for the owning repository.
