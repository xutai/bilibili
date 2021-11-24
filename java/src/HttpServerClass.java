import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.*;

import java.io.*;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.URLDecoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.CountDownLatch;


public class HttpServerClass {

    public static void main(String[] args) throws IOException {
        HttpServerClass.handleHTTP();
    }

    public static Map<String, List<String>> getUrlParameters(String url)
            throws UnsupportedEncodingException {
        Map<String, List<String>> params = new HashMap<String, List<String>>();
        String[] urlParts = url.split("\\?");
        if (urlParts.length > 1) {
            String query = urlParts[1];
            for (String param : query.split("&")) {
                String pair[] = param.split("=", 2);
                String key = URLDecoder.decode(pair[0], "UTF-8");
                String value = "";
                if (pair.length > 1) {
                    value = URLDecoder.decode(pair[1], "UTF-8");
                }
                List<String> values = params.get(key);
                if (values == null) {
                    values = new ArrayList<String>();
                    params.put(key, values);
                }
                values.add(value);
            }
        }
        return params;
    }

    public static String getQueryString(String url, String tag) {
        String[] params = url.split("&");
        Map<String, String> map = new HashMap<String, String>();
        for (String param : params) {
            String name = param.split("=")[0];
            String value = param.split("=")[1];
            map.put(name, value);
        }

        Set<String> keys = map.keySet();
        for (String key : keys) {
            if (key.equals(tag)) {
                return map.get(key);
            }
            System.out.println("Name=" + key);
            System.out.println("Value=" + map.get(key));
        }
        return "";
    }

    static class MyHandler implements HttpHandler {

        public void downloadVid(byte[] arrayOfBytes, String vname) {
            Path vidFilePath = Paths.get("../flv/" + vname + ".flv");
            try(
                    BufferedOutputStream bufferedOutputStream = new BufferedOutputStream(new FileOutputStream(String.valueOf(vidFilePath)))
            ) {
                bufferedOutputStream.write((byte[]) arrayOfBytes);
                System.out.format("%s.flv is downloaded!%n", vname);
            } catch (IOException e) {
                e.printStackTrace();
            }
        }

        public void handle(HttpExchange httpExchange) throws IOException {
            (new Thread(new HandleHttpThreadClass(httpExchange))).start();
        }
    }

    public static void handleHTTP() throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);
        HttpContext httpContext = server.createContext("/", new MyHandler());
        server.setExecutor(null); // creates a default executor
        server.start();
    }

}


class HandleHttpThreadClass extends Thread {
    static final String HTMLFileStr = "../client/bilibili.html";
    static final Path HTMLFilePath = Paths.get(HTMLFileStr);

    private HttpExchange httpExchange = null;
    public void run() {
        System.out.format("%srunning a new thread!%n", "");
        try {
            handle(httpExchange);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    public HandleHttpThreadClass(HttpExchange httpExchange) {
        this.httpExchange = httpExchange;
    }

    public void handle(HttpExchange httpExchange) throws IOException {
        String reqMethod = httpExchange.getRequestMethod();
        URI reqURI = httpExchange.getRequestURI();
        String reqURIStr = reqURI.toString();
        String reqURIPath = reqURI.getPath();
        String reqURIQuery = reqURI.getQuery();
        InputStream reqBody = httpExchange.getRequestBody();
        OutputStream os = httpExchange.getResponseBody();
        Headers reqHeaders = httpExchange.getRequestHeaders();
        Headers resHeaders = httpExchange.getResponseHeaders();
        String response;

        CountDownLatch cdl = new CountDownLatch(1);

        if (reqURIStr.equals("/")) {
//                response =
//                        reqMethod + "\r\n\r\n" +
//                                reqURI + "\r\n\r\n" +
//                                reqHeaders.getClass() + "\r\n\r\n" +
//                                reqHeaders.entrySet() + "\r\n\r\n" +
//                                reqHeaders.keySet() + "\r\n\r\n" +
//                                reqHeaders.values() + "\r\n\r\n" +
//                                httpExchange.getResponseHeaders().keySet() + "\r\n\r\n" +
//                                httpExchange.getResponseBody().toString() + "\r\n\r\n" +
//                                Arrays.toString(reqBody.readAllBytes());

            Charset charset = StandardCharsets.US_ASCII;
            StringBuilder content = new StringBuilder();
            try (BufferedReader reader = Files.newBufferedReader(HTMLFilePath, charset)) {
                String line = null;
                while ((line = reader.readLine()) != null) {
//                        System.out.println(line);
                    content.append(line);
                }
                response = content.toString();
//                BufferedReader reader = Files.newBufferedReader(filePath, charset);
//                Byte[] allBytes =

                httpExchange.sendResponseHeaders(200, response.length());
                os.write(response.getBytes());
            } catch (IOException ex) {
                System.err.format("IOException: %s%n", ex);
            }

        } else if (reqURIPath.equals("/bilibiliurl")) {
            resHeaders.add("Access-Control-Allow-Origin", "*");
            response = resHeaders.entrySet().toString();

            Map<String, List<String>> queryParameters = HttpServerClass.getUrlParameters(reqURIStr);
            String aid = queryParameters.get("aid").get(0);
            String p = queryParameters.get("p").get(0);

            HttpClient client = HttpClient.newBuilder()
                    .version(HttpClient.Version.HTTP_1_1)
                    .followRedirects(HttpClient.Redirect.NORMAL)
                    .connectTimeout(Duration.ofSeconds(20))
                    .build();
            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.bilibili.com/x/web-interface/view?aid=" + aid))
                    .timeout(Duration.ofMinutes(2))
                    .header("Content-Type", "application/json")
                    .GET()
                    .build();
            try {
                HttpResponse<String> clientResponse = client.send(httpRequest, HttpResponse.BodyHandlers.ofString());
                String body = clientResponse.body();
                ObjectMapper mapper = new ObjectMapper();
                LinkedHashMap mm = mapper.readValue(body, LinkedHashMap.class);
                LinkedHashMap<String, ?> data1jackson = (LinkedHashMap<String, String>) mm.get("data");

                Integer cid;
                String vname;
                String title;
                Integer videos;
                int page = Integer.parseInt(p);
                title = (String) data1jackson.get("title");
                videos = (Integer) data1jackson.get("videos");
                if (p.isEmpty()) {
                    cid = (Integer) data1jackson.get("cid");
                    vname = (String) data1jackson.get("title");
                } else {
                    ArrayList pages = (ArrayList) data1jackson.get("pages");
                    LinkedHashMap pageL = (LinkedHashMap) pages.get(page - 1);
                    cid = (Integer) pageL.get("cid");
                    vname = (String) pageL.get("part");
                }

                int qn = 116;
                String url = "https://api.bilibili.com/x/player/playurl?avid=" + aid + "&cid=" + cid + "&qn=" + qn + "&otype=json";

//                    Map<String, ?> options = new HashMap<>();
//                    options.put("hostname", "api.bilibili.com");
//                    HashMap<String, String> headers = new HashMap<>();
//                    headers.put("cookie", "SESSDATA=253831f6%2C1643533759%2C97ff2*81");
//                    options.put("headers", headers);

                HttpRequest httpRequest2 = HttpRequest.newBuilder()
                        .uri(URI.create(url))
                        .timeout(Duration.ofMinutes(2))
                        .header("hostname", "api.bilibili.com")
                        .header("cookie", "SESSDATA=253831f6%2C1643533759%2C97ff2*81")
                        .GET()
                        .build();

                HttpResponse<String> clientResponse2 = client.send(httpRequest2, HttpResponse.BodyHandlers.ofString());
                String body2 = clientResponse2.body();
                ObjectMapper mapper2 = new ObjectMapper();
                LinkedHashMap mm2 = mapper2.readValue(body2, LinkedHashMap.class);
                LinkedHashMap<String, ?> data2jackson = (LinkedHashMap<String, String>) mm2.get("data");

                ArrayList<LinkedHashMap> durlList = (ArrayList<LinkedHashMap>) data2jackson.get("durl");
                LinkedHashMap durlMap = durlList.get(0);
                String durl = (String) durlMap.get("url");
                String format = (String) data2jackson.get("format");
                Integer quality = (Integer) data2jackson.get("quality");
                String durlfix;

                if (!durl.contains("https")) {
                    durlfix = durl.replace("http", "https");
                } else {
                    durlfix = durl;
                }

                vname = vname.replace(": ", "");
                vname = vname.replace(":", "");

                try {
                    HttpRequest httpRequest3 = HttpRequest.newBuilder()
                            .uri(URI.create(durlfix))
                            .timeout(Duration.ofMinutes(2))
                            .header("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.13; rv:56.0) Gecko/20100101 Firefox/56.0")
                            .header("Accept", "*/*")
                            .header("Accept-Language", "en-US,en;q=0.5")
                            .header("Accept-Encoding", "gzip, deflate, br")
                            .header("Range", "bytes=0-")
                            .header("Referer", "https://www.bilibili.com/video/av" + aid + "/")
                            .header("Origin", "https://www.bilibili.com")
                            .GET()
                            .build();

                    // working
                    // Exception: java.lang.OutOfMemoryError thrown from the UncaughtExceptionHandler in thread "HttpClient-1-Worker-1"
                    // Exception: java.lang.OutOfMemoryError thrown from the UncaughtExceptionHandler in thread "HttpClient-1-SelectorManager"
                    // Exception: java.lang.OutOfMemoryError thrown from the UncaughtExceptionHandler in thread "server-timer"
                    // Java HotSpot(TM) 64-Bit Server VM warning: Exception java.lang.OutOfMemoryError occurred dispatching signal UNKNOWN to handler- the VM may need to be forcibly terminated
//                        String finalVname1 = vname;
//                        HttpResponse.BodyHandler<byte[]> downstreamHandler = responseInfo -> {
//                            System.out.format("%s.flv is downloading!%n", finalVname1);
//                            return HttpResponse.BodySubscribers.ofByteArray();
//                        };
//                        HttpResponse.BodyHandler<byte[]> bodyHandler = HttpResponse.BodyHandlers.buffering(downstreamHandler, 1024 * 1024);
//                        String finalVname = vname;
//                        CompletableFuture cf = client.sendAsync(httpRequest3, bodyHandler)
//                                .thenApply(HttpResponse::body)
//                                .thenAccept(arrayOfBytes -> downloadVid((byte[]) arrayOfBytes, finalVname))
//                                .thenRun(() -> {
//                                    String resBodyString = String.format("%s.flv is downloaded!%n", finalVname);
//                                    byte[] resBodyToWriteToOutput = resBodyString.getBytes(StandardCharsets.UTF_8);
//                                    int resBodyToWriteToOutputLength = resBodyToWriteToOutput.length;
//                                    try {
//                                        httpExchange.sendResponseHeaders(200, resBodyToWriteToOutputLength);
//                                        os.write(resBodyToWriteToOutput);
//                                    } catch (IOException e) {
//                                        e.printStackTrace();
//                                    }
////                                    cdl.countDown();
//                                });
//                        cf.thenRun(() -> {});
////                        cdl.await();





                    // working
                    // Exception: java.lang.OutOfMemoryError thrown from the UncaughtExceptionHandler in thread "HttpClient-1-Worker-1"
                    // Exception: java.lang.OutOfMemoryError thrown from the UncaughtExceptionHandler in thread "server-timer"
//                        String finalVname1 = vname;
//                        HttpResponse.BodyHandler<byte[]> bodyHandler = responseInfo -> {
//                            System.out.format("%s.flv is downloading!%n", finalVname1);
//                            return HttpResponse.BodySubscribers.ofByteArray();
//                        };
//                        CompletableFuture<HttpResponse<byte[]>> cf = client.sendAsync(httpRequest3, bodyHandler);
////                        Function<HttpResponse<byte[]>, byte[]> f = httpResponse -> httpResponse.body();
//                        Function<HttpResponse<byte[]>, byte[]> f = HttpResponse::body;
//                        CompletableFuture<byte[]> cf2 = cf.thenApply(f);
////                        Consumer consumer2 = x -> System.out.println(x);
////                        Consumer consumer = System.out::println;
//                        String finalVname = vname;
//                        Consumer consumer = arrayOfBytes -> downloadVid((byte[]) arrayOfBytes, finalVname);;
//                        CompletableFuture cf3 = cf2.thenAccept(consumer);
//                        cf3.thenRun(() -> {
//                            cdl.countDown();
//                        });
//                        cdl.await();




//                        // working
                    HttpResponse.BodyHandler<InputStream> bodyHandler = HttpResponse.BodyHandlers.ofInputStream();
                    HttpResponse<InputStream> clientResponse3 = client.send(httpRequest3, bodyHandler);
                    Path vidFilePath;
                    if (videos == 1) {
                        vidFilePath = Paths.get("../flv/" + title + " " + vname + ".flv");
                    } else {
                        String fileDirectory;
                        fileDirectory = "../flv/" +  title;
                        vidFilePath = Paths.get( fileDirectory,"/p" +  p + " - " + title + " - " + vname + ".flv");
                        Path filePath = Paths.get(fileDirectory);
                        if (Files.notExists(filePath)) {
                            Files.createDirectories(filePath);
                        }

                    }
                    InputStream bodyInputStream = clientResponse3.body();

                    try (BufferedOutputStream bufferedOutputStream = new BufferedOutputStream(new FileOutputStream(String.valueOf(vidFilePath)));) {
                        // v3
                        int len;
                        int total = 0;
                        byte[] buff = new byte[1024 * 1024];
                        System.out.format("%s.flv is downloading!%n", vname);
                        while ((len = bodyInputStream.read(buff)) != -1) {
                            bufferedOutputStream.write(buff, 0, len);
//                                total += len;
//                                System.out.format("%s.flv received %s mega byte%n", vname, total / (1024 * 1024));
                        }

                        String finalVname = vname;
                        String resBodyString = String.format("%s.flv is downloaded!%n", finalVname);
                        byte[] resBodyToWriteToOutput = resBodyString.getBytes(StandardCharsets.UTF_8);
                        int resBodyToWriteToOutputLength = resBodyToWriteToOutput.length;
                        try {
                            httpExchange.sendResponseHeaders(200, resBodyToWriteToOutputLength);
                            os.write(resBodyToWriteToOutput);
                        } catch (IOException e) {
                            e.printStackTrace();
                        }

                        cdl.countDown();

                        System.out.format("%s.flv is downloaded! aid=%s,  cid=%s, quality=%s, format=%s %n", vname, aid, cid, quality, format);
                    } catch (IOException ex) {
                        System.err.format("IOException: %s%n", ex);
                    }
                    cdl.await();



                    // not working
                    // BufferedWriter writer = Files.newBufferedWriter(filePath, charset)
                    // write text to a file, is video has charset? not working

                    // not working
//                        HttpResponse.BodyHandler<Path> bodyHandler = HttpResponse.BodyHandlers.ofFile(filePath);
//                        client.sendAsync(httpRequest3, bodyHandler)
//                                .thenApply(HttpResponse::body)
//                                .thenAccept(System.out::println);

                    System.out.format("This process is running out...%s%n", "");

                } catch (Exception ex) {
                    System.err.format("IOException: %s%n", ex);
                }



            } catch (InterruptedException e) {
                e.printStackTrace();
            }

        } else if (reqURIStr.equals("/favicon.ico")) {
            httpExchange.sendResponseHeaders(404, -1);
        } else {
            response = "not found";
            httpExchange.sendResponseHeaders(404, -1);
            os.write(response.getBytes());
        }
        os.close();

    }
}