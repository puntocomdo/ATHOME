# Preview server for this Mac (no Node installed): serves public/ like Vercel's cleanUrls.
# /api/* needs the real Node server (npm start) or Vercel, so it answers with an error here.
require "webrick"
root = File.expand_path("../public", __dir__)
port = (ENV["PORT"] || 3000).to_i
types = WEBrick::HTTPUtils::DefaultMimeTypes.merge("webp" => "image/webp", "json" => "application/json")
s = WEBrick::HTTPServer.new(Port: port, BindAddress: "127.0.0.1", MimeTypes: types, AccessLog: [], Logger: WEBrick::Log.new($stderr, WEBrick::Log::WARN))
s.mount_proc("/") do |req, res|
  path = req.path
  if path.start_with?("/api/")
    res.status = 503
    res["content-type"] = "application/json"
    res.body = '{"error":"Preview without Node: the API is not available here."}'
    next
  end
  rel = path == "/" ? "index.html" : path.sub(%r{^/}, "")
  file = File.expand_path(rel, root)
  file += ".html" if !File.file?(file) && File.file?(file + ".html")
  if file.start_with?(root + "/") && File.file?(file)
    res["content-type"] = WEBrick::HTTPUtils.mime_type(file, types)
    res.body = File.binread(file)
  else
    res.status = 404
    res.body = "Not found"
  end
end
trap("INT") { s.shutdown }
trap("TERM") { s.shutdown }
puts "Preview on http://localhost:#{port} (static only)"
s.start
