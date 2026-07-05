FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
# Restore trước khi copy source: layer restore được cache,
# sửa code không cần tải lại NuGet (rebuild được khi offline)
COPY MyOwnLearning.csproj .
RUN dotnet restore
COPY . .
RUN dotnet publish MyOwnLearning.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8000
ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 8000
ENTRYPOINT ["dotnet", "MyOwnLearning.dll"]
